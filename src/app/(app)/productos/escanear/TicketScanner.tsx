'use client'

import { useActionState, useRef, useState, useTransition } from 'react'
import { scanTicket, addScannedProducts, type TicketState, type ScannedProduct } from '@/lib/actions/tickets'
import { useRouter } from 'next/navigation'

const BASICS_LIST = [
  { key: 'sal',            label: 'Sal',             emoji: '🧂' },
  { key: 'pimienta',       label: 'Pimienta',         emoji: '🌶️' },
  { key: 'aceite_oliva',   label: 'Aceite de oliva',  emoji: '🫒' },
  { key: 'aceite_girasol', label: 'Aceite girasol',   emoji: '🌻' },
  { key: 'mantequilla',    label: 'Mantequilla',       emoji: '🧈' },
  { key: 'agua',           label: 'Agua',              emoji: '💧' },
  { key: 'azucar',         label: 'Azúcar',            emoji: '🍯' },
  { key: 'harina',         label: 'Harina',            emoji: '🌾' },
  { key: 'vinagre',        label: 'Vinagre',           emoji: '🫙' },
  { key: 'oregano',        label: 'Orégano',           emoji: '🌿' },
  { key: 'pimenton',       label: 'Pimentón',          emoji: '🔴' },
  { key: 'ajo_polvo',      label: 'Ajo en polvo',      emoji: '🧄' },
  { key: 'caldo',          label: 'Caldo',             emoji: '🍵' },
  { key: 'laurel',         label: 'Laurel',            emoji: '🍃' },
]

function normalize(s: string) {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9 ]/g, '').trim()
}

function detectBasicsInProducts(scanned: ScannedProduct[]) {
  return BASICS_LIST.filter(b => {
    const bNorm = normalize(b.label)
    return scanned.some(p => {
      const pNorm = normalize(p.nombre ?? '')
      return bNorm.split(' ').some(w => w.length > 2 && pNorm.includes(w)) ||
             pNorm.split(' ').some(w => w.length > 2 && bNorm.includes(w))
    })
  })
}

const initial: TicketState = { products: null, error: null }

export function TicketScanner() {
  const [state, action, isPending] = useActionState(scanTicket, initial)
  const [preview, setPreview] = useState<string | null>(null)
  const [adding, startAdding] = useTransition()
  const [added, setAdded] = useState(false)
  // Map productIndex → resolved name (for truncated/ambiguous)
  const [resolved, setResolved] = useState<Record<number, string>>({})
  const [showNonFood, setShowNonFood] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const img = new window.Image()
    const objectUrl = URL.createObjectURL(file)
    img.onload = () => {
      const MAX = 1400
      let { width, height } = img
      if (width > MAX || height > MAX) {
        if (width > height) { height = Math.round((height * MAX) / width); width = MAX }
        else { width = Math.round((width * MAX) / height); height = MAX }
      }
      const canvas = document.createElement('canvas')
      canvas.width = width; canvas.height = height
      canvas.getContext('2d')!.drawImage(img, 0, 0, width, height)
      canvas.toBlob(blob => {
        if (!blob) return
        const compressed = new File([blob], file.name, { type: 'image/jpeg' })
        const dt = new DataTransfer()
        dt.items.add(compressed)
        if (fileRef.current) fileRef.current.files = dt.files
        setPreview(URL.createObjectURL(compressed))
      }, 'image/jpeg', 0.82)
      URL.revokeObjectURL(objectUrl)
    }
    img.src = objectUrl
    setAdded(false)
    setResolved({})
    setDismissed(false)
  }

  const [dismissed, setDismissed] = useState(false)
  const [removedIndices, setRemovedIndices] = useState<Set<number>>(new Set())

  function handleClear() {
    setDismissed(true)
    setPreview(null)
    setResolved({})
    setAdded(false)
    setShowNonFood(false)
    setRemovedIndices(new Set())
    if (fileRef.current) fileRef.current.value = ''
  }

  function removeProduct(idx: number) {
    setRemovedIndices(prev => new Set([...prev, idx]))
    // Limpiar resolved si existía
    setResolved(r => { const n = {...r}; delete n[idx]; return n })
  }

  const allProducts = (!dismissed && state.products) ? state.products : []
  const foodProducts = allProducts.filter(p => p.es_comida !== false)
  const nonFoodProducts = allProducts.filter(p => p.es_comida === false)
  const activeFood = foodProducts.filter((_, i) => !removedIndices.has(i))
  const needsClarification = foodProducts.filter((p, i) => !removedIndices.has(i) && (p.truncado || p.ambiguo))
  const allResolved = needsClarification.every(p => {
    const idx = foodProducts.indexOf(p)
    return !!resolved[idx]
  })

  function handleAdd() {
    startAdding(async () => {
      const toAdd = foodProducts
        .map((p, i) => ({ ...p, nombre: resolved[i] ?? p.nombre }))
        .filter((_, i) => !removedIndices.has(i))
      const { error } = await addScannedProducts(toAdd, nonFoodProducts)
      if (!error) {
        setAdded(true)
        setTimeout(() => router.push('/productos'), 1200)
      }
    })
  }

  return (
    <div className="px-4 py-4 space-y-4">
      {/* Intro */}
      <div className="rounded-xl bg-blue-50 border border-blue-100 px-4 py-3 text-sm text-blue-800">
        Fotografía el ticket y la IA extraerá solo los alimentos automáticamente.
        <span className="font-semibold"> +8⭐ por escaneo</span>
      </div>

      {/* Image picker */}
      <form action={action} className="space-y-4">
        <div
          className="relative rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 overflow-hidden cursor-pointer hover:border-green-400 transition"
          onClick={() => fileRef.current?.click()}
        >
          {preview ? (
            <div className="relative w-full">
              <img src={preview} alt="Vista previa" className="w-full max-h-72 object-contain" />
              <div className="absolute bottom-2 right-2 bg-white/90 rounded-lg px-2 py-1 text-xs text-gray-600 shadow">
                Toca para cambiar
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <span className="text-5xl mb-3">📷</span>
              <p className="text-sm font-medium text-gray-600">Toca para añadir foto</p>
              <p className="text-xs mt-1">JPG, PNG o WebP · Máx. 6MB</p>
            </div>
          )}
        </div>

        <input
          ref={fileRef}
          type="file"
          name="ticket"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          capture="environment"
          className="hidden"
          onChange={handleFileChange}
        />

        <button
          type="submit"
          disabled={!preview || isPending}
          className="w-full rounded-xl bg-green-600 px-4 py-3.5 text-sm font-semibold text-white shadow transition hover:bg-green-700 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isPending ? (
            <>
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.37 0 0 5.37 0 12h4z"/>
              </svg>
              Analizando ticket...
            </>
          ) : <>🔍 Analizar ticket</>}
        </button>
      </form>

      {/* Error */}
      {state.error && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      )}

      {/* Results */}
      {activeFood.length > 0 && !added && (
        <div className="space-y-4">

          {/* Header */}
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-700">
              {activeFood.length} alimentos encontrados
            </p>
            <div className="flex items-center gap-3">
              <span className="text-xs text-green-600 font-medium">+8⭐ ganados</span>
              <button
                type="button"
                onClick={handleClear}
                className="text-xs text-gray-400 hover:text-red-500 transition flex items-center gap-1"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
                Descartar
              </button>
            </div>
          </div>

          {/* Food products list */}
          <div className="space-y-2">
            {foodProducts.map((p, i) => {
              if (removedIndices.has(i)) return null
              const needsClarity = p.truncado || p.ambiguo
              const isResolved = !!resolved[i]

              return (
                <div key={i} className={`rounded-xl border shadow-sm overflow-hidden relative ${
                  needsClarity && !isResolved
                    ? 'border-amber-200 bg-amber-50'
                    : 'border-gray-100 bg-white'
                }`}>
                  {/* X button */}
                  <button
                    type="button"
                    onClick={() => removeProduct(i)}
                    className="absolute top-2 right-2 w-5 h-5 rounded-full bg-gray-100 hover:bg-red-100 hover:text-red-500 flex items-center justify-center text-gray-400 transition z-10"
                    title="Eliminar"
                  >
                    <svg width="8" height="8" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <line x1="1" y1="1" x2="9" y2="9"/><line x1="9" y1="1" x2="1" y2="9"/>
                    </svg>
                  </button>

                  {/* Product row */}
                  <div className="flex items-center gap-3 px-4 py-3 pr-8">
                    <span className="text-lg">
                      {needsClarity && !isResolved ? '❓' : '🛒'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${
                        needsClarity && !isResolved ? 'text-amber-800' : 'text-gray-900'
                      }`}>
                        {isResolved ? resolved[i] : p.nombre}
                      </p>
                      <p className="text-xs text-gray-400">
                        {p.cantidad !== null ? `x${p.cantidad}` : ''}
                        {p.precio !== null ? ` · ${p.precio.toFixed(2)}€` : ''}
                        {needsClarity && !isResolved && (
                          <span className="text-amber-600 font-medium ml-1">
                            {p.truncado ? '· nombre incompleto' : '· necesita aclaración'}
                          </span>
                        )}
                        {isResolved && (
                          <span className="text-green-600 font-medium ml-1">· aclarado ✓</span>
                        )}
                      </p>
                    </div>
                    {isResolved && (
                      <button
                        type="button"
                        onClick={() => setResolved(r => { const n = {...r}; delete n[i]; return n })}
                        className="text-xs text-gray-400 hover:text-gray-600 mr-4"
                      >
                        editar
                      </button>
                    )}
                  </div>

                  {/* Clarification panel */}
                  {needsClarity && !isResolved && (
                    <ClarificationPanel
                      product={p}
                      onSelect={name => setResolved(r => ({ ...r, [i]: name }))}
                    />
                  )}
                </div>
              )
            })}
          </div>

          {/* Basics detected */}
          {(() => {
            const detected = detectBasicsInProducts(foodProducts)
            if (!detected.length) return null
            return (
              <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-3">
                <p className="text-xs font-semibold text-emerald-700 mb-2">
                  🧂 Básicos detectados — se marcarán como disponibles
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {detected.map(b => (
                    <span key={b.key} className="flex items-center gap-1 rounded-full bg-emerald-100 border border-emerald-300 px-2 py-1 text-xs text-emerald-800 font-medium">
                      {b.emoji} {b.label}
                    </span>
                  ))}
                </div>
              </div>
            )
          })()}

          {/* Non-food section */}
          {nonFoodProducts.length > 0 && (
            <div>
              <button
                type="button"
                onClick={() => setShowNonFood(v => !v)}
                className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform ${showNonFood ? 'rotate-90' : ''}`}>
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
                {nonFoodProducts.length} no alimentarios eliminados
              </button>
              {showNonFood && (
                <div className="mt-2 space-y-1">
                  {nonFoodProducts.map((p, i) => (
                    <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 text-xs text-gray-400">
                      <span>🚫</span>
                      <span className="line-through">{p.nombre}</span>
                      {p.precio !== null && <span>{p.precio.toFixed(2)}€</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Pending clarifications warning */}
          {needsClarification.length > 0 && !allResolved && (
            <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-xs text-amber-800">
              Aclara los productos marcados con ❓ antes de añadir
            </div>
          )}

          {/* Add button */}
          <button
            onClick={handleAdd}
            disabled={adding || !allResolved && needsClarification.length > 0}
            className="w-full rounded-xl bg-green-600 px-4 py-3.5 text-sm font-semibold text-white shadow transition hover:bg-green-700 active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {adding ? (
              <>
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.37 0 0 5.37 0 12h4z"/>
                </svg>
                Añadiendo...
              </>
            ) : `➕ Añadir ${activeFood.length} alimentos a la despensa`}
          </button>
        </div>
      )}

      {/* Success */}
      {added && (
        <div className="rounded-xl bg-green-50 border border-green-200 px-4 py-4 text-center text-sm text-green-800 font-medium">
          ✅ Productos añadidos correctamente
        </div>
      )}
    </div>
  )
}

function ClarificationPanel({
  product,
  onSelect,
}: {
  product: ScannedProduct
  onSelect: (name: string) => void
}) {
  const [custom, setCustom] = useState('')

  return (
    <div className="border-t border-amber-200 px-4 py-3 bg-white space-y-2">
      <p className="text-xs text-amber-700 font-medium">
        {product.truncado ? '¿Cuál es el nombre completo?' : '¿Qué producto es exactamente?'}
      </p>

      {/* Suggestions */}
      {product.sugerencias?.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {product.sugerencias.map((s, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onSelect(s)}
              className="rounded-full border border-green-300 bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700 hover:bg-green-100 transition"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Custom input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={custom}
          onChange={e => setCustom(e.target.value)}
          placeholder="Escribe el nombre..."
          className="flex-1 rounded-xl border border-gray-300 px-3 py-2 text-xs outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
          onKeyDown={e => { if (e.key === 'Enter' && custom.trim()) onSelect(custom.trim()) }}
        />
        <button
          type="button"
          disabled={!custom.trim()}
          onClick={() => custom.trim() && onSelect(custom.trim())}
          className="rounded-xl bg-green-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-40 hover:bg-green-700 transition"
        >
          OK
        </button>
      </div>
    </div>
  )
}
