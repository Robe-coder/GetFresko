'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { GAMIFICATION_POINTS } from '@/types/index'

export async function addProduct(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const customName = formData.get('custom_name') as string
  const quantity = parseFloat(formData.get('quantity') as string) || 1
  const unit = formData.get('unit') as string
  const location = formData.get('location') as string
  const expiryDate = formData.get('expiry_date') as string || null
  const purchaseDate = formData.get('purchase_date') as string || null
  const notes = formData.get('notes') as string || null

  const { error } = await supabase.from('user_products').insert({
    user_id: user.id,
    custom_name: customName,
    quantity,
    unit,
    location,
    expiry_date: expiryDate || null,
    purchase_date: purchaseDate || null,
    notes,
    status: 'active',
  })

  if (error) throw new Error(error.message)

  // Sumar puntos por añadir producto
  await supabase.rpc('add_freskopoints', {
    p_user_id: user.id,
    p_points: GAMIFICATION_POINTS.product_added,
  })

  revalidatePath('/productos')
  revalidatePath('/dashboard')
  redirect('/productos')
}

export async function updateProductStatus(
  productId: string,
  status: 'eaten' | 'wasted'
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: product } = await supabase
    .from('user_products')
    .select('expiry_date')
    .eq('id', productId)
    .eq('user_id', user.id)
    .single()

  await supabase
    .from('user_products')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', productId)
    .eq('user_id', user.id)

  // Calcular puntos
  let points = 0
  if (status === 'eaten') {
    const today = new Date().toISOString().split('T')[0]
    if (product?.expiry_date === today) {
      points = GAMIFICATION_POINTS.product_eaten_expiry_day
    } else {
      points = GAMIFICATION_POINTS.product_eaten
    }
  } else {
    points = GAMIFICATION_POINTS.product_wasted // negativo
  }

  await Promise.all([
    supabase.rpc('add_freskopoints', {
      p_user_id: user.id,
      p_points: points,
    }),
    supabase.rpc('update_streak', { p_user_id: user.id }),
  ])

  revalidatePath('/productos')
  revalidatePath('/dashboard')
}

export async function deleteProduct(productId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  await supabase
    .from('user_products')
    .delete()
    .eq('id', productId)
    .eq('user_id', user.id)

  revalidatePath('/productos')
  revalidatePath('/dashboard')
}
