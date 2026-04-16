'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { aiClient, AI_MODELS, AI_PROMPTS } from '@/lib/ai'
import { GAMIFICATION_POINTS } from '@/types/index'

export type ScannedProduct = {
  nombre: string
  cantidad: number | null
  precio: number | null
}

export type TicketState = {
  products: ScannedProduct[] | null
  error: string | null
}

export async function scanTicket(
  _prevState: TicketState,
  formData: FormData
): Promise<TicketState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { products: null, error: 'No autenticado' }

  const file = formData.get('ticket') as File | null
  if (!file || file.size === 0) {
    return { products: null, error: 'Selecciona una imagen del ticket' }
  }

  // Validate type
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    return { products: null, error: 'Formato no soportado. Usa JPG, PNG o WebP.' }
  }

  // Max 4MB
  if (file.size > 4 * 1024 * 1024) {
    return { products: null, error: 'La imagen es demasiado grande (máx. 4MB)' }
  }

  // Convert to base64
  const bytes = await file.arrayBuffer()
  const base64 = Buffer.from(bytes).toString('base64')
  const mediaType = file.type as 'image/jpeg' | 'image/png' | 'image/webp'

  let products: ScannedProduct[]
  try {
    const message = await aiClient.messages.create({
      model: AI_MODELS.ocr,
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType,
                data: base64,
              },
            },
            {
              type: 'text',
              text: AI_PROMPTS.ocr(),
            },
          ],
        },
      ],
    })

    const text =
      message.content[0].type === 'text' ? message.content[0].text : ''
    const json = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()
    const result = JSON.parse(json)
    products = result.productos ?? []
  } catch {
    return { products: null, error: 'No se pudo analizar el ticket. Inténtalo con una foto más clara.' }
  }

  if (products.length === 0) {
    return { products: null, error: 'No se encontraron productos en el ticket.' }
  }

  // Award points + update streak
  await Promise.all([
    supabase.rpc('add_freskopoints', {
      p_user_id: user.id,
      p_points: GAMIFICATION_POINTS.ticket_scanned,
    }),
    supabase.rpc('update_streak', { p_user_id: user.id }),
  ])

  revalidatePath('/dashboard')
  return { products, error: null }
}

export async function addScannedProducts(products: ScannedProduct[]) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const today = new Date().toISOString().split('T')[0]

  const rows = products
    .filter(p => p.nombre?.trim())
    .map(p => ({
      user_id: user.id,
      custom_name: p.nombre.trim(),
      quantity: p.cantidad ?? 1,
      unit: 'unidad',
      location: 'despensa',
      purchase_date: today,
      status: 'active',
    }))

  if (!rows.length) return { error: 'No hay productos para añadir' }

  const { error } = await supabase.from('user_products').insert(rows)
  if (error) return { error: error.message }

  // Points per product added
  await supabase.rpc('add_freskopoints', {
    p_user_id: user.id,
    p_points: GAMIFICATION_POINTS.product_added * rows.length,
  })

  revalidatePath('/productos')
  revalidatePath('/dashboard')
  return { error: null }
}
