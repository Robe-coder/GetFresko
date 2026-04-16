'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { AI_MODELS, AI_PROMPTS } from '@/lib/ai'
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

  // Aceptar también image/jpg por si el DataTransfer lo pone así
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  const mimeType = file.type || 'image/jpeg'
  if (!allowedTypes.includes(mimeType)) {
    return { products: null, error: `Formato no soportado (${mimeType}). Usa JPG, PNG o WebP.` }
  }

  // 6MB limit (matches next.config.ts bodySizeLimit)
  if (file.size > 6 * 1024 * 1024) {
    return { products: null, error: 'La imagen es demasiado grande (máx. 6MB)' }
  }

  // Convert to base64
  const bytes = await file.arrayBuffer()
  const base64 = Buffer.from(bytes).toString('base64')

  // Usar fetch directo a OpenRouter (formato OpenAI-compatible con image_url)
  // El SDK de Anthropic tiene problemas con visión en modo proxy
  let products: ScannedProduct[]
  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://getfresko.app',
        'X-Title': 'GetFresko',
      },
      body: JSON.stringify({
        model: AI_MODELS.ocr,
        max_tokens: 3000,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${base64}`,
                },
              },
              {
                type: 'text',
                text: AI_PROMPTS.ocr(),
              },
            ],
          },
        ],
      }),
    })

    if (!res.ok) {
      const errBody = await res.text()
      console.error('[scanTicket] OpenRouter error:', res.status, errBody)
      return { products: null, error: `Error del servidor de IA (${res.status}). Inténtalo de nuevo.` }
    }

    const data = await res.json()
    const text = data.choices?.[0]?.message?.content ?? ''

    // Extraer JSON — varios intentos de limpieza
    let result: { productos?: ScannedProduct[] } | null = null
    const attempts = [
      // 1. Extraer primer objeto JSON completo
      () => { const m = text.match(/\{[\s\S]*\}/); return m ? JSON.parse(m[0]) : null },
      // 2. Sin code fences
      () => JSON.parse(text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()),
      // 3. Reparar JSON truncado: cerrar arrays/objetos abiertos
      () => {
        let s = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()
        // Contar llaves/corchetes y cerrar los que faltan
        let braces = 0, brackets = 0
        for (const c of s) { if (c==='{') braces++; else if (c==='}') braces--; else if (c==='[') brackets++; else if (c===']') brackets-- }
        // Quitar coma trailing antes de cerrar
        s = s.replace(/,\s*([}\]])/g, '$1')
        if (brackets > 0) s += ']'.repeat(brackets)
        if (braces > 0) s += '}'.repeat(braces)
        return JSON.parse(s)
      },
    ]
    for (const attempt of attempts) {
      try { result = attempt(); if (result) break } catch { /* siguiente intento */ }
    }
    if (!result) throw new Error(`JSON inválido: ${text.slice(0, 200)}`)
    products = result.productos ?? []
  } catch (err) {
    console.error('[scanTicket] error:', err)
    return { products: null, error: 'No se pudo analizar el ticket. Inténtalo con una foto más clara.' }
  }

  if (products.length === 0) {
    return { products: null, error: 'No se encontraron productos en el ticket.' }
  }

  await Promise.allSettled([
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

  await supabase.rpc('add_freskopoints', {
    p_user_id: user.id,
    p_points: GAMIFICATION_POINTS.product_added * rows.length,
  })

  revalidatePath('/productos')
  revalidatePath('/dashboard')
  return { error: null }
}
