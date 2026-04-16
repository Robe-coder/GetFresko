'use client'

import { useState, useTransition } from 'react'
import { updateProductStatus, deleteProduct } from '@/lib/actions/products'

interface Product {
  id: string
  custom_name: string
  quantity: number
  unit: string
  location: string
  expiry_date: string | null
  notes: string | null
  status: string
}

export function ProductCard({ product }: { product: Product }) {
  const [isPending, startTransition] = useTransition()
  const [showActions, setShowActions] = useState(false)

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const daysLeft = product.expiry_date
    ? Math.ceil((new Date(product.expiry_date).getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    : null

  const expiryColor =
    daysLeft === null ? 'text-gray-400' :
    daysLeft < 0 ? 'bg-red-100 text-red-700' :
    daysLeft <= 2 ? 'bg-red-50 text-red-600' :
    daysLeft <= 5 ? 'bg-orange-50 text-orange-600' :
    'bg-green-50 text-green-700'

  const expiryLabel =
    daysLeft === null ? null :
    daysLeft < 0 ? 'caducado' :
    daysLeft === 0 ? 'hoy' :
    daysLeft === 1 ? 'mañana' :
    `${daysLeft}d`

  function handleStatus(status: 'eaten' | 'wasted') {
    startTransition(async () => {
      await updateProductStatus(product.id, status)
      setShowActions(false)
    })
  }

  function handleDelete() {
    if (!confirm('¿Eliminar este producto?')) return
    startTransition(async () => {
      await deleteProduct(product.id)
    })
  }

  return (
    <div className={`rounded-xl bg-white border border-gray-100 shadow-sm transition ${isPending ? 'opacity-50' : ''}`}>
      <button
        className="w-full flex items-center justify-between px-4 py-3 text-left"
        onClick={() => setShowActions(v => !v)}
      >
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">{product.custom_name}</p>
          <p className="text-xs text-gray-400 mt-0.5">
            {product.quantity} {product.unit}
            {product.notes && ` · ${product.notes}`}
          </p>
        </div>
        <div className="flex items-center gap-2 ml-2 shrink-0">
          {expiryLabel && (
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${expiryColor}`}>
              {expiryLabel}
            </span>
          )}
          <svg
            width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            className={`text-gray-300 transition-transform ${showActions ? 'rotate-180' : ''}`}
          >
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </div>
      </button>

      {showActions && (
        <div className="border-t border-gray-50 px-4 py-2 flex gap-2">
          <button
            onClick={() => handleStatus('eaten')}
            disabled={isPending}
            className="flex-1 rounded-lg bg-green-50 py-2 text-xs font-semibold text-green-700 hover:bg-green-100 transition"
          >
            ✅ Comido +{daysLeft === 0 ? 5 : 10}⭐
          </button>
          <button
            onClick={() => handleStatus('wasted')}
            disabled={isPending}
            className="flex-1 rounded-lg bg-orange-50 py-2 text-xs font-semibold text-orange-700 hover:bg-orange-100 transition"
          >
            🗑️ Desperdiciado
          </button>
          <button
            onClick={handleDelete}
            disabled={isPending}
            className="rounded-lg bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-400 hover:bg-gray-100 transition"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  )
}
