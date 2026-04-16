-- GetFresko — Schema completo de Supabase
-- Ejecutar en el SQL Editor de Supabase (dashboard → SQL Editor → New query)

-- ============================================================
-- PROFILES — Perfil de usuario + gamificación
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  display_name TEXT,
  province TEXT,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  terms_accepted_at TIMESTAMPTZ,
  freskopoints INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_activity_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles: own row"
  ON profiles FOR ALL USING (auth.uid() = id);

-- ============================================================
-- PRODUCTS_MASTER — Catálogo global compartido
-- ============================================================
CREATE TABLE IF NOT EXISTS products_master (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  typical_shelf_life_days INTEGER,
  frozen_shelf_life_days INTEGER,
  fridge_shelf_life_days INTEGER,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- USER_PRODUCTS — Inventario personal
-- ============================================================
CREATE TABLE IF NOT EXISTS user_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  product_master_id UUID REFERENCES products_master(id),
  custom_name TEXT NOT NULL,
  quantity NUMERIC NOT NULL DEFAULT 1,
  unit TEXT DEFAULT 'unidad',
  location TEXT DEFAULT 'despensa',
  purchase_date DATE,
  expiry_date DATE,
  is_predicted BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE user_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_products: own rows"
  ON user_products FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- RECIPES_CACHE — Caché de recetas IA por hash SHA-256
-- ============================================================
CREATE TABLE IF NOT EXISTS recipes_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ingredients_hash TEXT NOT NULL,
  diet_type TEXT DEFAULT 'omnivore',
  language TEXT DEFAULT 'es',
  recipe_json JSONB NOT NULL,
  usage_count INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(ingredients_hash, diet_type, language)
);

-- ============================================================
-- SUBSCRIPTIONS — Estado Stripe
-- ============================================================
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  status TEXT DEFAULT 'free',
  plan TEXT DEFAULT 'free',
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "subscriptions: own row"
  ON subscriptions FOR SELECT USING (auth.uid() = user_id);

-- ============================================================
-- DAILY_LOGS — Historial para gráficos
-- ============================================================
CREATE TABLE IF NOT EXISTS daily_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  saved_count INTEGER DEFAULT 0,
  wasted_count INTEGER DEFAULT 0,
  money_saved NUMERIC DEFAULT 0.00,
  points_earned INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

ALTER TABLE daily_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "daily_logs: own rows"
  ON daily_logs FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- FUNCIÓN + TRIGGER: crear profile al registrarse
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
    VALUES (NEW.id, NEW.email)
    ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.subscriptions (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ============================================================
-- CONSUMPTION_EVENTS — Registro anonimizable de consumo por usuario
-- ============================================================
CREATE TABLE IF NOT EXISTS consumption_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  category TEXT,
  location TEXT,
  action TEXT NOT NULL, -- 'added' | 'eaten' | 'wasted' | 'recipe_used' | 'ticket_scanned'
  province TEXT,
  quantity NUMERIC,
  unit TEXT,
  purchase_date DATE,
  expiry_date DATE,
  days_before_expiry INTEGER, -- positivo=consumido antes, negativo=caducado
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE consumption_events ENABLE ROW LEVEL SECURITY;
-- Solo el propio usuario puede ver sus eventos (los análisis se harán vía service_role)
CREATE POLICY "consumption_events: own rows"
  ON consumption_events FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- FUNCIÓN: add_freskopoints — sumar/restar puntos al perfil
-- ============================================================
CREATE OR REPLACE FUNCTION public.add_freskopoints(p_user_id UUID, p_points INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE public.profiles
    SET freskopoints = GREATEST(0, freskopoints + p_points),
        updated_at   = NOW()
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- FUNCIÓN: update_streak — actualiza racha diaria del usuario
-- Devuelve: bonus de puntos conseguido (0, 50 o 200)
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_streak(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_last_date   DATE;
  v_streak      INTEGER;
  v_bonus       INTEGER := 0;
BEGIN
  SELECT last_activity_date, current_streak
    INTO v_last_date, v_streak
    FROM public.profiles
   WHERE id = p_user_id;

  IF v_last_date = CURRENT_DATE THEN
    -- Ya se actualizó hoy, no hacer nada
    RETURN 0;
  ELSIF v_last_date = CURRENT_DATE - INTERVAL '1 day' THEN
    -- Día consecutivo
    v_streak := COALESCE(v_streak, 0) + 1;
  ELSE
    -- Racha rota
    v_streak := 1;
  END IF;

  -- Calcular bonus por hito
  IF v_streak = 7 THEN
    v_bonus := 50;
  ELSIF v_streak = 30 THEN
    v_bonus := 200;
  END IF;

  UPDATE public.profiles
    SET current_streak      = v_streak,
        longest_streak      = GREATEST(COALESCE(longest_streak, 0), v_streak),
        last_activity_date  = CURRENT_DATE,
        freskopoints        = GREATEST(0, freskopoints + v_bonus),
        updated_at          = NOW()
  WHERE id = p_user_id;

  RETURN v_bonus;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- BADGES TABLE — Badges desbloqueados por usuario
-- ============================================================
CREATE TABLE IF NOT EXISTS user_badges (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_key  TEXT NOT NULL,
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, badge_key)
);

ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_badges: own rows"
  ON user_badges FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- SEED: Productos maestros básicos
-- ============================================================
INSERT INTO products_master (name, category, typical_shelf_life_days, fridge_shelf_life_days, frozen_shelf_life_days) VALUES
  ('Leche entera',     'dairy',     3,   7,   90),
  ('Huevos',           'dairy',     21,  35,  365),
  ('Pechuga de pollo', 'meat',      1,   3,   270),
  ('Carne picada',     'meat',      1,   2,   180),
  ('Tomate',           'vegetable', 7,   14,  365),
  ('Lechuga',          'vegetable', 3,   7,   null),
  ('Zanahoria',        'vegetable', 14,  28,  365),
  ('Manzana',          'fruit',     14,  30,  365),
  ('Plátano',          'fruit',     5,   7,   90),
  ('Pan de molde',     'grain',     5,   14,  90),
  ('Pasta',            'grain',     730, 730, null),
  ('Arroz',            'grain',     730, 730, null),
  ('Zumo de naranja',  'beverage',  3,   7,   90),
  ('Yogur natural',    'dairy',     null,14,  60),
  ('Queso fresco',     'dairy',     null,7,   60)
ON CONFLICT DO NOTHING;
