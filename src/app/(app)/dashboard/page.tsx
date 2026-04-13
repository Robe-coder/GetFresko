import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/Header'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Productos próximos a caducar (≤5 días)
  const today = new Date()
  const in5Days = new Date(today)
  in5Days.setDate(today.getDate() + 5)

  const { data: expiringProducts } = await supabase
    .from('user_products')
    .select('*')
    .eq('user_id', user!.id)
    .eq('status', 'active')
    .not('expiry_date', 'is', null)
    .lte('expiry_date', in5Days.toISOString().split('T')[0])
    .order('expiry_date', { ascending: true })
    .limit(5)

  const { count: totalProducts } = await supabase
    .from('user_products')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user!.id)
    .eq('status', 'active')

  // Puntos del usuario
  const { data: profile } = await supabase
    .from('profiles')
    .select('freskopoints, current_streak')
    .eq('id', user!.id)
    .single()

  return (
    <>
      <Header
        action={
          <Link
            href="/productos/nuevo"
            className="flex items-center justify-center w-8 h-8 rounded-full bg-green-600 text-white shadow-sm hover:bg-green-700 transition"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
          </Link>
        }
      />

      <div className="px-4 py-4 space-y-5">
        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          <StatCard
            emoji="📦"
            value={totalProducts ?? 0}
            label="en despensa"
          />
          <StatCard
            emoji="⭐"
            value={profile?.freskopoints ?? 0}
            label="FreskoPoints"
          />
          <StatCard
            emoji="🔥"
            value={profile?.current_streak ?? 0}
            label="días racha"
          />
        </div>

        {/* Alertas de caducidad */}
        {expiringProducts && expiringProducts.length > 0 ? (
          <section>
            <h2 className="text-sm font-semibold text-gray-700 mb-2">
              Caducan pronto
            </h2>
            <div className="space-y-2">
              {expiringProducts.map((product: any) => {
                const expiry = new Date(product.expiry_date)
                const daysLeft = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
                const urgent = daysLeft <= 2

                return (
                  <Link
                    key={product.id}
                    href={`/productos/${product.id}`}
                    className="flex items-center justify-between rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-sm hover:border-gray-200 transition"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {product.custom_name}
                      </p>
                      <p className="text-xs text-gray-400 capitalize">{product.location}</p>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                      urgent
                        ? 'bg-red-50 text-red-600'
                        : 'bg-orange-50 text-orange-600'
                    }`}>
                      {daysLeft === 0 ? 'hoy' : daysLeft === 1 ? 'mañana' : `${daysLeft}d`}
                    </span>
                  </Link>
                )
              })}
            </div>
          </section>
        ) : (
          <div className="rounded-xl border border-dashed border-gray-200 bg-white p-6 text-center">
            <span className="text-3xl">✅</span>
            <p className="mt-2 text-sm text-gray-500">
              Todo en orden — nada caduca en los próximos 5 días
            </p>
          </div>
        )}

        {/* Accesos rápidos */}
        <section>
          <h2 className="text-sm font-semibold text-gray-700 mb-2">Acciones rápidas</h2>
          <div className="grid grid-cols-2 gap-3">
            <QuickAction href="/productos/nuevo" emoji="➕" label="Añadir producto" />
            <QuickAction href="/recetas" emoji="👨‍🍳" label="Generar receta" />
            <QuickAction href="/productos/escanear" emoji="📷" label="Escanear ticket" />
            <QuickAction href="/estadisticas" emoji="📊" label="Mi progreso" />
          </div>
        </section>
      </div>
    </>
  )
}

function StatCard({ emoji, value, label }: { emoji: string; value: number; label: string }) {
  return (
    <div className="rounded-xl bg-white border border-gray-100 shadow-sm p-3 text-center">
      <div className="text-2xl">{emoji}</div>
      <div className="text-xl font-bold text-gray-900 mt-1">{value}</div>
      <div className="text-[10px] text-gray-400 leading-tight">{label}</div>
    </div>
  )
}

function QuickAction({ href, emoji, label }: { href: string; emoji: string; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-xl bg-white border border-gray-100 shadow-sm px-4 py-3 hover:border-green-200 hover:bg-green-50 transition"
    >
      <span className="text-xl">{emoji}</span>
      <span className="text-sm font-medium text-gray-700">{label}</span>
    </Link>
  )
}
