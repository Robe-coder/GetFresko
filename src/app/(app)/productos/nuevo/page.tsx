import { Header } from '@/components/layout/Header'
import { addProduct } from '@/lib/actions/products'
import { createClient } from '@/lib/supabase/server'

export default async function NuevoProductoPage() {
  const supabase = await createClient()
  const { data: masters } = await supabase
    .from('products_master')
    .select('id, name, category, typical_shelf_life_days, fridge_shelf_life_days, frozen_shelf_life_days')
    .order('name')

  const today = new Date().toISOString().split('T')[0]

  return (
    <>
      <Header title="Añadir producto" back />
      <form action={addProduct} className="px-4 py-4 space-y-4 pb-8">

        {/* Nombre */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Nombre *</label>
          <input
            name="custom_name"
            type="text"
            required
            placeholder="ej. Leche entera"
            list="productos-sugeridos"
            className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
          />
          <datalist id="productos-sugeridos">
            {masters?.map(m => (
              <option key={m.id} value={m.name} />
            ))}
          </datalist>
        </div>

        {/* Cantidad + Unidad */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Cantidad</label>
            <input
              name="quantity"
              type="number"
              defaultValue="1"
              min="0.1"
              step="0.1"
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Unidad</label>
            <select
              name="unit"
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 bg-white"
            >
              <option value="unidad">unidad</option>
              <option value="g">g</option>
              <option value="kg">kg</option>
              <option value="ml">ml</option>
              <option value="l">l</option>
              <option value="rebanada">rebanada</option>
              <option value="taza">taza</option>
            </select>
          </div>
        </div>

        {/* Ubicación */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Dónde está</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { value: 'despensa', emoji: '🗄️', label: 'Despensa' },
              { value: 'nevera', emoji: '🧊', label: 'Nevera' },
              { value: 'congelador', emoji: '❄️', label: 'Congelador' },
            ].map(({ value, emoji, label }) => (
              <label key={value} className="cursor-pointer">
                <input type="radio" name="location" value={value} defaultChecked={value === 'despensa'} className="peer sr-only" />
                <div className="flex flex-col items-center rounded-xl border-2 border-gray-200 py-3 text-sm font-medium text-gray-500 transition peer-checked:border-green-500 peer-checked:bg-green-50 peer-checked:text-green-700">
                  <span className="text-xl">{emoji}</span>
                  <span className="text-xs mt-1">{label}</span>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Fecha de compra */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Fecha de compra</label>
          <input
            name="purchase_date"
            type="date"
            defaultValue={today}
            max={today}
            className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
          />
        </div>

        {/* Fecha de caducidad */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">
            Fecha de caducidad <span className="text-gray-400 font-normal">(opcional)</span>
          </label>
          <input
            name="expiry_date"
            type="date"
            min={today}
            className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
          />
        </div>

        {/* Notas */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">
            Notas <span className="text-gray-400 font-normal">(opcional)</span>
          </label>
          <input
            name="notes"
            type="text"
            placeholder="ej. sin lactosa, eco..."
            className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
          />
        </div>

        <button
          type="submit"
          className="w-full rounded-xl bg-green-600 px-4 py-3.5 text-sm font-semibold text-white shadow transition hover:bg-green-700 active:scale-[0.98]"
        >
          Añadir a la despensa +2 ⭐
        </button>
      </form>
    </>
  )
}
