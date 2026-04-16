import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/Header'

const BADGES = [
  { key: 'first_product', emoji: '📦', name: 'Primera despensa', desc: 'Añade tu primer producto', condition: (s: Stats) => s.totalProducts > 0 },
  { key: 'no_waste_week', emoji: '🌿', name: 'Semana verde', desc: 'Sin desperdiciar 7 días', condition: (s: Stats) => s.currentStreak >= 7 },
  { key: 'streak_30', emoji: '🔥', name: 'Fuego mensual', desc: '30 días de racha', condition: (s: Stats) => s.longestStreak >= 30 },
  { key: 'points_100', emoji: '⭐', name: 'Centenario', desc: 'Llega a 100 FreskoPoints', condition: (s: Stats) => s.totalPoints >= 100 },
  { key: 'points_500', emoji: '🏆', name: 'Maestro Fresko', desc: 'Llega a 500 FreskoPoints', condition: (s: Stats) => s.totalPoints >= 500 },
  { key: 'saved_10', emoji: '💚', name: 'Héroe del frigorífico', desc: 'Consume 10 productos antes de caducar', condition: (s: Stats) => s.savedItems >= 10 },
  { key: 'recipe_first', emoji: '👨‍🍳', name: 'Chef Fresko', desc: 'Genera tu primera receta IA', condition: (s: Stats) => s.recipesUsed > 0 },
  { key: 'ticket_first', emoji: '🧾', name: 'Escáner pro', desc: 'Escanea tu primer ticket', condition: (s: Stats) => s.ticketsScanned > 0 },
]

type Stats = {
  totalPoints: number
  currentStreak: number
  longestStreak: number
  savedItems: number
  wastedItems: number
  totalProducts: number
  recipesUsed: number
  ticketsScanned: number
  last7Days: { date: string; saved: number; wasted: number }[]
}

export default async function EstadisticasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)
  const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0]

  const [
    { data: profile },
    { count: savedCount },
    { count: wastedCount },
    { count: totalProducts },
    { data: logs },
  ] = await Promise.all([
    supabase
      .from('profiles')
      .select('freskopoints, current_streak, longest_streak')
      .eq('id', user!.id)
      .single(),
    supabase
      .from('user_products')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user!.id)
      .eq('status', 'eaten'),
    supabase
      .from('user_products')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user!.id)
      .eq('status', 'wasted'),
    supabase
      .from('user_products')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user!.id),
    supabase
      .from('daily_logs')
      .select('date, saved_count, wasted_count')
      .eq('user_id', user!.id)
      .gte('date', sevenDaysAgoStr)
      .order('date', { ascending: true }),
  ])

  const stats: Stats = {
    totalPoints: profile?.freskopoints ?? 0,
    currentStreak: profile?.current_streak ?? 0,
    longestStreak: profile?.longest_streak ?? 0,
    savedItems: savedCount ?? 0,
    wastedItems: wastedCount ?? 0,
    totalProducts: totalProducts ?? 0,
    recipesUsed: 0, // no dedicated counter yet
    ticketsScanned: 0, // no dedicated counter yet
    last7Days: logs?.map(l => ({
      date: l.date,
      saved: l.saved_count,
      wasted: l.wasted_count,
    })) ?? [],
  }

  const savedRatio =
    stats.savedItems + stats.wastedItems > 0
      ? Math.round((stats.savedItems / (stats.savedItems + stats.wastedItems)) * 100)
      : 0

  const unlockedBadges = BADGES.filter(b => b.condition(stats))
  const lockedBadges = BADGES.filter(b => !b.condition(stats))

  return (
    <>
      <Header title="Mi progreso" />
      <div className="px-4 py-4 space-y-5 pb-8">

        {/* Points + Streak hero */}
        <div className="rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 p-5 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-green-100 font-medium">FreskoPoints</p>
              <p className="text-4xl font-bold mt-0.5">{stats.totalPoints}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-green-100 font-medium">Racha actual</p>
              <p className="text-4xl font-bold mt-0.5">🔥 {stats.currentStreak}</p>
              <p className="text-[10px] text-green-200">Récord: {stats.longestStreak}d</p>
            </div>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-3">
          <StatCard emoji="✅" value={stats.savedItems} label="Consumidos" color="green" />
          <StatCard emoji="🗑️" value={stats.wastedItems} label="Desperdiciados" color="red" />
          <StatCard emoji="♻️" value={`${savedRatio}%`} label="Tasa ahorro" color="blue" />
        </div>

        {/* Money saved estimate */}
        <div className="rounded-xl bg-white border border-gray-100 shadow-sm px-4 py-4">
          <p className="text-xs font-semibold text-gray-500 mb-1">Ahorro estimado</p>
          <p className="text-2xl font-bold text-green-700">
            {(stats.savedItems * 1.5).toFixed(2)}€
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Basado en ~1,50€/producto consumido antes de caducar
          </p>
        </div>

        {/* Badges */}
        <div>
          <p className="text-xs font-semibold text-gray-500 mb-2">
            Badges — {unlockedBadges.length}/{BADGES.length}
          </p>
          <div className="grid grid-cols-2 gap-2">
            {unlockedBadges.map(b => (
              <BadgeCard key={b.key} emoji={b.emoji} name={b.name} desc={b.desc} unlocked />
            ))}
            {lockedBadges.map(b => (
              <BadgeCard key={b.key} emoji={b.emoji} name={b.name} desc={b.desc} unlocked={false} />
            ))}
          </div>
        </div>

        {/* Next milestone */}
        <NextMilestone points={stats.totalPoints} />

      </div>
    </>
  )
}

function StatCard({
  emoji, value, label, color,
}: {
  emoji: string; value: string | number; label: string; color: 'green' | 'red' | 'blue'
}) {
  const colors = {
    green: 'text-green-700',
    red: 'text-red-600',
    blue: 'text-blue-600',
  }
  return (
    <div className="rounded-xl bg-white border border-gray-100 shadow-sm p-3 text-center">
      <div className="text-2xl">{emoji}</div>
      <div className={`text-xl font-bold mt-1 ${colors[color]}`}>{value}</div>
      <div className="text-[10px] text-gray-400 leading-tight mt-0.5">{label}</div>
    </div>
  )
}

function BadgeCard({
  emoji, name, desc, unlocked,
}: {
  emoji: string; name: string; desc: string; unlocked: boolean
}) {
  return (
    <div className={`rounded-xl border px-3 py-3 flex items-center gap-3 ${
      unlocked
        ? 'bg-white border-green-200 shadow-sm'
        : 'bg-gray-50 border-gray-100 opacity-50'
    }`}>
      <span className={`text-2xl ${unlocked ? '' : 'grayscale'}`}>{emoji}</span>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-gray-900 truncate">{name}</p>
        <p className="text-[10px] text-gray-400 leading-tight">{desc}</p>
        {unlocked && <p className="text-[10px] text-green-600 font-medium mt-0.5">✅ Desbloqueado</p>}
      </div>
    </div>
  )
}

function NextMilestone({ points }: { points: number }) {
  const milestones = [
    { at: 50, label: '50 pts — Principiante' },
    { at: 100, label: '100 pts — Centenario' },
    { at: 250, label: '250 pts — Experto' },
    { at: 500, label: '500 pts — Maestro Fresko' },
    { at: 1000, label: '1000 pts — Leyenda' },
  ]
  const next = milestones.find(m => m.at > points)
  if (!next) return null

  const prev = milestones[milestones.indexOf(next) - 1]
  const start = prev?.at ?? 0
  const progress = Math.round(((points - start) / (next.at - start)) * 100)

  return (
    <div className="rounded-xl bg-white border border-gray-100 shadow-sm px-4 py-4">
      <div className="flex justify-between items-center mb-2">
        <p className="text-xs font-semibold text-gray-500">Próximo logro</p>
        <p className="text-xs text-gray-400">{points}/{next.at} pts</p>
      </div>
      <p className="text-sm font-medium text-gray-900 mb-2">{next.label}</p>
      <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-green-400 to-emerald-500 transition-all"
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>
    </div>
  )
}
