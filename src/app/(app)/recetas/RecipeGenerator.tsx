'use client'

import { useActionState, useState } from 'react'
import { generateRecipe, type RecipeState } from '@/lib/actions/recipes'

interface Product {
  id: string
  custom_name: string
  expiry_date: string | null
  location: string
}

const DIET_OPTIONS = [
  { value: 'omnivore', label: 'Todo', emoji: '🍖' },
  { value: 'vegetarian', label: 'Vegetariano', emoji: '🥦' },
  { value: 'vegan', label: 'Vegano', emoji: '🌱' },
  { value: 'glutenfree', label: 'Sin gluten', emoji: '🌾' },
]

const BASICS_LIST = [
  { key: 'sal',           label: 'Sal',             emoji: '🧂' },
  { key: 'pimienta',      label: 'Pimienta',         emoji: '🌶️' },
  { key: 'aceite_oliva',  label: 'Aceite de oliva',  emoji: '🫒' },
  { key: 'aceite_girasol',label: 'Aceite girasol',   emoji: '🌻' },
  { key: 'mantequilla',   label: 'Mantequilla',      emoji: '🧈' },
  { key: 'agua',          label: 'Agua',             emoji: '💧' },
  { key: 'azucar',        label: 'Azúcar',           emoji: '🍯' },
  { key: 'harina',        label: 'Harina',           emoji: '🌾' },
  { key: 'vinagre',       label: 'Vinagre',          emoji: '🫙' },
  { key: 'oregano',       label: 'Orégano',          emoji: '🌿' },
  { key: 'pimenton',      label: 'Pimentón',         emoji: '🔴' },
  { key: 'ajo_polvo',     label: 'Ajo en polvo',     emoji: '🧄' },
  { key: 'caldo',         label: 'Caldo',            emoji: '🍵' },
  { key: 'laurel',        label: 'Laurel',           emoji: '🍃' },
]

// Todos los básicos empiezan marcados — el usuario desmarca los que no tiene
const DEFAULT_BASICS = new Set(BASICS_LIST.map(b => b.key))

function normalize(s: string) {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9 ]/g, '').trim()
}

function isBasicInPantry(basicLabel: string, products: Product[]): boolean {
  const norm = normalize(basicLabel)
  return products.some(p => {
    const pNorm = normalize(p.custom_name)
    return norm.split(' ').some(w => w.length > 2 && pNorm.includes(w)) ||
           pNorm.split(' ').some(w => w.length > 2 && norm.includes(w))
  })
}

const initial: RecipeState = { recipe: null, error: null, cached: false }

export function RecipeGenerator({ products }: { products: Product[] }) {
  const [state, action, isPending] = useActionState(generateRecipe, initial)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    () => new Set(products.slice(0, 8).map(p => p.id))
  )
  const [selectedBasics, setSelectedBasics] = useState<Set<string>>(DEFAULT_BASICS)

  function toggleProduct(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleBasic(key: string) {
    setSelectedBasics(prev => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  function daysLeft(date: string | null) {
    if (!date) return null
    return Math.ceil((new Date(date).getTime() - today.getTime()) / 86400000)
  }

  // Construir lista de básicos seleccionados para enviar al action
  const selectedBasicNames = BASICS_LIST
    .filter(b => selectedBasics.has(b.key))
    .map(b => b.label)

  return (
    <div className="px-4 py-4 space-y-5">
      {/* Recipe result */}
      {state.recipe && <RecipeCard recipe={state.recipe} cached={state.cached} />}

      {state.error && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      )}

      <form action={action} className="space-y-5">
        {/* Hidden: selected product ids */}
        {Array.from(selectedIds).map(id => (
          <input key={id} type="hidden" name="product_ids" value={id} />
        ))}
        {/* Hidden: selected basics */}
        {selectedBasicNames.map(name => (
          <input key={name} type="hidden" name="basic_names" value={name} />
        ))}

        {/* Diet type */}
        <div>
          <p className="text-xs font-semibold text-gray-500 mb-2">Dieta</p>
          <div className="grid grid-cols-4 gap-2">
            {DIET_OPTIONS.map(opt => (
              <label key={opt.value} className="cursor-pointer">
                <input type="radio" name="diet_type" value={opt.value} defaultChecked={opt.value === 'omnivore'} className="peer sr-only" />
                <div className="flex flex-col items-center rounded-xl border-2 border-gray-200 py-2.5 text-xs font-medium text-gray-500 transition peer-checked:border-green-500 peer-checked:bg-green-50 peer-checked:text-green-700">
                  <span className="text-lg">{opt.emoji}</span>
                  <span className="mt-0.5 leading-tight text-center">{opt.label}</span>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Pantry ingredients */}
        <div>
          <p className="text-xs font-semibold text-gray-500 mb-2">
            Ingredientes de tu despensa ({selectedIds.size} seleccionados)
          </p>
          {products.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-200 p-6 text-center text-sm text-gray-400">
              Tu despensa está vacía. Añade productos primero.
            </div>
          ) : (
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {products.map(p => {
                const days = daysLeft(p.expiry_date)
                const isChecked = selectedIds.has(p.id)
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => toggleProduct(p.id)}
                    className={`w-full flex items-center justify-between rounded-xl border-2 px-4 py-2.5 text-left transition ${
                      isChecked ? 'border-green-400 bg-green-50' : 'border-gray-200 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                        isChecked ? 'border-green-500 bg-green-500' : 'border-gray-300'
                      }`}>
                        {isChecked && (
                          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                            <polyline points="1.5,5 4,7.5 8.5,2" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </span>
                      <span className="text-sm text-gray-900">{p.custom_name}</span>
                    </div>
                    {days !== null && (
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        days <= 2 ? 'bg-red-50 text-red-600' :
                        days <= 5 ? 'bg-orange-50 text-orange-600' :
                        'bg-gray-50 text-gray-400'
                      }`}>
                        {days === 0 ? 'hoy' : days === 1 ? 'mañana' : `${days}d`}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Basics */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-gray-500">Básicos de cocina</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setSelectedBasics(new Set(BASICS_LIST.map(b => b.key)))}
                className="text-[11px] text-green-600 font-medium hover:underline"
              >
                Todos
              </button>
              <span className="text-gray-200">|</span>
              <button
                type="button"
                onClick={() => setSelectedBasics(new Set())}
                className="text-[11px] text-gray-400 font-medium hover:underline"
              >
                Ninguno
              </button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {BASICS_LIST.map(b => {
              const active = selectedBasics.has(b.key)
              const inPantry = isBasicInPantry(b.label, products)
              return (
                <button
                  key={b.key}
                  type="button"
                  onClick={() => toggleBasic(b.key)}
                  className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                    active
                      ? inPantry
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                        : 'border-green-400 bg-green-50 text-green-700'
                      : 'border-gray-200 bg-white text-gray-400 line-through'
                  }`}
                >
                  <span>{b.emoji}</span>
                  <span>{b.label}</span>
                  {inPantry && active && (
                    <span className="ml-0.5 text-emerald-500">✓</span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        <button
          type="submit"
          disabled={isPending || selectedIds.size === 0}
          className="w-full rounded-xl bg-green-600 px-4 py-3.5 text-sm font-semibold text-white shadow transition hover:bg-green-700 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isPending ? (
            <>
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.37 0 0 5.37 0 12h4z"/>
              </svg>
              Generando receta...
            </>
          ) : (
            <>👨‍🍳 Generar receta +5⭐</>
          )}
        </button>
      </form>
    </div>
  )
}

function RecipeCard({
  recipe, cached,
}: {
  recipe: NonNullable<RecipeState['recipe']>
  cached: boolean
}) {
  const difficultyColor = {
    'fácil': 'bg-green-50 text-green-700',
    'media': 'bg-orange-50 text-orange-700',
    'difícil': 'bg-red-50 text-red-700',
  }[recipe.difficulty] ?? 'bg-gray-50 text-gray-700'

  return (
    <div className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
      <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-4 py-4 text-white">
        <div className="flex items-start justify-between gap-2">
          <h2 className="text-base font-bold leading-tight">{recipe.title}</h2>
          {cached && (
            <span className="shrink-0 text-[10px] bg-white/20 rounded-full px-2 py-0.5">de caché</span>
          )}
        </div>
        <div className="flex flex-wrap gap-3 mt-2 text-xs text-green-100">
          <span>🍽️ {recipe.servings} personas</span>
          <span>⏱️ {recipe.prepTime} min</span>
          <span className={`rounded-full px-2 py-0.5 ${difficultyColor} text-xs font-medium`}>
            {recipe.difficulty}
          </span>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        <div>
          <p className="text-xs font-semibold text-gray-500 mb-2">Ingredientes</p>
          <ul className="space-y-1">
            {recipe.ingredients.map((ing, i) => (
              <li key={i} className="flex gap-2 text-sm text-gray-700">
                <span className="text-gray-300">•</span>
                <span><strong>{ing.amount}</strong> {ing.name}</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-xs font-semibold text-gray-500 mb-2">Pasos</p>
          <ol className="space-y-2">
            {recipe.steps.map((step, i) => (
              <li key={i} className="flex gap-3 text-sm text-gray-700">
                <span className="shrink-0 w-5 h-5 rounded-full bg-green-100 text-green-700 text-xs font-bold flex items-center justify-center">
                  {i + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>

        {recipe.tips && (
          <div className="rounded-xl bg-amber-50 border border-amber-100 px-3 py-3 text-xs text-amber-800">
            <span className="font-semibold">Tip: </span>{recipe.tips}
          </div>
        )}
      </div>
    </div>
  )
}
