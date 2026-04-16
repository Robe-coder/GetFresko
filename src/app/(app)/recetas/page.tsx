import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/Header'
import { RecipeGenerator } from './RecipeGenerator'

export default async function RecetasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: products } = await supabase
    .from('user_products')
    .select('id, custom_name, expiry_date, location')
    .eq('user_id', user!.id)
    .eq('status', 'active')
    .order('expiry_date', { ascending: true, nullsFirst: false })

  return (
    <>
      <Header title="Recetas IA" />
      <RecipeGenerator products={products ?? []} />
    </>
  )
}
