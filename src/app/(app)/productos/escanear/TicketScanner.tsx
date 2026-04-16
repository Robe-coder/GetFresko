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
  const [confirmed, setConfirmed] = useState<ScannedProduct[]>([])
  const [adding, startAdding] = useTransition()
  const [added, setAdded] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  // When products arrive, init confirmation list
  const products = state.products ?? confirmed

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Comprimir antes de previsualizar y enviar
    const img = new window.Image()
    const objectUrl = URL.createObjectURL(file)
    img.onload = () => {
      const MAX = 1400 // px max dimension
      let { width, height } = img
      if (width > MAX || height > MAX) {
        if (width > height) { height = Math.round((height * MAX) / width); width = MAX }
        else { width = Math.round((width * MAX) / height); height = MAX }
      }
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      canvas.getContext('2d')!.drawImage(img, 0, 0, width, height)
      canvas.toBlob(blob => {
        if (!blob) return
        const compressed = new File([blob], file.name, { type: 'image/jpeg' })
        // Reemplazar el input con el archivo comprimido
        const dt = new DataTransfer()
        dt.items.add(compressed)
        if (fileRef.current) fileRef.current.files = dt.files
        setPreview(URL.createObjectURL(compressed))
      }, 'image/jpeg', 0.82)
      URL.revokeObjectURL(objectUrl)
    }
    img.src = objectUrl
    setAdded(false)
    setConfirmed([])
  }

  function handleAdd() {
    startAdding(async () => {
      const toAdd = state.products ?? []
      const { error } = await addScannedProducts(toAdd)
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
        Fotografía el ticket del supermercado y la IA extraerá los productos automáticamente.
        <span className="font-semibold"> +8⭐ por escaneo</span>
      </div>

      {/* Image picker */}
      <form action={action} className="space-y-4">
        <div
          className="relative rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 overflow-hidden cursor-pointer hover:border-green-400 transition"
          onClick={() => fileRef.current?.click()}
        >
          {preview ? (
            <div className="relative w-full" style={{ minHeight: 200 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={preview}
                alt="Vista previa del ticket"
                className="w-full max-h-72 object-contain"
              />
              <div className="absolute bottom-2 right-2 bg-white/90 rounded-lg px-2 py-1 text-xs text-gray-600 shadow">
                Toca para cambiar
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <span className="text-5xl mb-3">📷</span>
              <p className="text-sm font-medium text-gray-600">Toca para añadir foto</p>
              <p className="text-xs mt-1">JPG, PNG o WebP · Máx. 4MB</p>
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
          ) : (
            <>🔍 Analizar ticket</>
          )}
        </button>
      </form>

      {/* Error */}
      {state.error && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      )}

      {/* Extracted products */}
      {state.products && state.products.length > 0 && !added && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-700">
              {state.products.length} productos encontrados
            </p>
            <span className="text-xs text-green-600 font-medium">+8⭐ ganados</span>
          </div>

          <div className="space-y-2">
            {state.products.map((p, i) => (
              <div key={i} className="flex items-center gap-3 rounded-xl bg-white border border-gray-100 shadow-sm px-4 py-3">
                <span className="text-lg">🛒</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{p.nombre}</p>
                  <p className="text-xs text-gray-400">
                    {p.cantidad !== null ? `x${p.cantidad}` : ''}
                    {p.precio !== null ? ` · ${p.precio?.toFixed(2)}€` : ''}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Básicos detectados */}
          {(() => {
            const detected = detectBasicsInProducts(state.products!)
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

          <button
            onClick={handleAdd}
            disabled={adding}
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
            ) : (
              `➕ Añadir todos a la despensa`
            )}
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
