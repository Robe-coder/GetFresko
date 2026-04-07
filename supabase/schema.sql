-- GetFresko — Schema completo de Supabase
-- Ejecutar en orden en el SQL Editor de Supabase

-- ============================================================
-- PRODUCTS_MASTER — Catálogo global compartido
-- ============================================================
CREATE TABLE products_master (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL, -- 'dairy','meat','vegetable','fruit','grain','beverage','other'
  typical_shelf_life_days INTEGER,
  frozen_shelf_life_days INTEGER,
  fridge_shelf_life_days INTEGER,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- USER_PRODUCTS — Inventario personal
-- ============================================================
CREATE TABLE user_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  product_master_id UUID REFERENCES products_master(id),
  custom_name TEXT,
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
CREATE POLICY "Users can only access their own products"
  ON user_products FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- RECIPES_CACHE — Caché de recetas IA
-- ============================================================
CREATE TABLE recipes_cache (
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
CREATE TABLE subscriptions (
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
CREATE POLICY "Users can only read their own subscription"
  ON subscriptions FOR SELECT USING (auth.uid() = user_id);

-- ============================================================
-- WASTE_STATS — Estadísticas de gamificación
-- ============================================================
CREATE TABLE waste_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  saved_items INTEGER DEFAULT 0,
  wasted_items INTEGER DEFAULT 0,
  estimated_money_saved NUMERIC DEFAULT 0.00,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  total_points INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE waste_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access their own stats"
  ON waste_stats FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- DAILY_LOGS — Historial para gráficos
-- ============================================================
CREATE TABLE daily_logs (
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
CREATE POLICY "Users can only access their own logs"
  ON daily_logs FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- FUNCIÓN: crear registro de stats automáticamente al registrar usuario
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.waste_stats (user_id) VALUES (NEW.id);
  INSERT INTO public.subscriptions (user_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ============================================================
-- SEED: Productos maestros básicos
-- ============================================================
INSERT INTO products_master (name, category, typical_shelf_life_days, fridge_shelf_life_days, frozen_shelf_life_days) VALUES
  ('Leche entera', 'dairy', 3, 7, 90),
  ('Huevos', 'dairy', 21, 35, 365),
  ('Pechuga de pollo', 'meat', 1, 3, 270),
  ('Carne picada', 'meat', 1, 2, 180),
  ('Tomate', 'vegetable', 7, 14, 365),
  ('Lechuga', 'vegetable', 3, 7, null),
  ('Zanahoria', 'vegetable', 14, 28, 365),
  ('Manzana', 'fruit', 14, 30, 365),
  ('Plátano', 'fruit', 5, 7, 90),
  ('Pan de molde', 'grain', 5, 14, 90),
  ('Pasta', 'grain', 730, 730, null),
  ('Arroz', 'grain', 730, 730, null),
  ('Zumo de naranja', 'beverage', 3, 7, 90),
  ('Yogur natural', 'dairy', null, 14, 60),
  ('Queso fresco', 'dairy', null, 7, 60);
