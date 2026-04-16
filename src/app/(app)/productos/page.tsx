import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/Header'
import { ProductCard } from '@/components/products/ProductCard'
import Link from 'next/link'

export default async function ProductosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: products } = await supabase
    .from('user_products')
    .select('*')
    .eq('user_id', user!.id)
    .eq('status', 'active')
    .order('expiry_date', { ascending: true, nullsFirst: false })

  const locations = ['nevera', 'despensa', 'congelador'] as const
  const grouped = locations.map(loc => ({
    loc,
    items: products?.filter(p => p.location === loc) ?? [],
  })).filter(g => g.items.length > 0)

  const locationLabels: Record<string, string> = {
    nevera: '🧊 Nevera',
    despensa: '🗄️ Despensa',
    congelador: '❄️ Congelador',
  }

  return (
    <>
      <Header
        title="Despensa"
        action={
          <Link
            href="/productos/nuevo"
            className="flex items-center justify-center w-8 h-8 rounded-full bg-green-600 text-white hover:bg-green-700 transition"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
          </Link>
        }
      />

      <div className="px-4 py-4 space-y-6">
        {!products?.length ? (
          <div className="rounded-xl border border-dashed border-gray-200 bg-white p-8 text-center">
            <p className="text-4xl mb-3">📦</p>
            <p className="font-medium text-gray-700">Tu despensa está vacía</p>
            <p className="text-sm text-gray-400 mt-1">Añade productos para empezar a gestionarlos</p>
            <Link
              href="/productos/nuevo"
              className="mt-4 inline-block rounded-xl bg-green-600 px-5 py-2.5 text-sm font-semibold text-white"
            >
              Añadir producto
            </Link>
          </div>
        ) : (
          grouped.map(({ loc, items }) => (
            <section key={loc}>
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                {locationLabels[loc]} · {items.length}
              </h2>
              <div className="space-y-2">
                {items.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </section>
          ))
        )}
      </div>
    </>
  )
}
