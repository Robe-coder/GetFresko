'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function completeOnboarding(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const province = formData.get('province') as string
  if (!province) return { error: 'Selecciona tu provincia' }

  const { error } = await supabase
    .from('profiles')
    .update({
      province,
      onboarding_completed: true,
      terms_accepted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard')
  return { error: null }
}
