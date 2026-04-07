import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Calcula los días restantes hasta la fecha de caducidad.
 * Retorna negativo si ya ha caducado.
 */
export function daysUntilExpiry(expiryDate: string): number {
  const expiry = new Date(expiryDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  expiry.setHours(0, 0, 0, 0)
  return Math.round((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

/**
 * Retorna el color de urgencia según días restantes.
 */
export function getExpiryColor(days: number): 'red' | 'orange' | 'yellow' | 'green' {
  if (days < 0) return 'red'
  if (days <= 2) return 'red'
  if (days <= 5) return 'orange'
  if (days <= 10) return 'yellow'
  return 'green'
}

/**
 * Calcula la fecha de caducidad predicha según ubicación y vida útil del producto.
 */
export function calculateExpiryDate(
  purchaseDate: string | undefined,
  shelfLifeDays: number | undefined
): string | undefined {
  if (!shelfLifeDays) return undefined
  const base = purchaseDate ? new Date(purchaseDate) : new Date()
  base.setDate(base.getDate() + shelfLifeDays)
  return base.toISOString().split('T')[0]
}

/**
 * Formatea moneda en EUR.
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount)
}

/**
 * Genera un hash SHA-256 para el caché de recetas.
 * Usable solo en entorno server (Node.js).
 */
export async function hashIngredients(
  ingredients: string[],
  dietType: string,
  language: string
): Promise<string> {
  const sorted = [...ingredients].sort().join(',')
  const raw = `${sorted}|${dietType}|${language}`
  const encoder = new TextEncoder()
  const data = encoder.encode(raw)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}
