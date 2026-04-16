import { Header } from '@/components/layout/Header'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function AjustesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  async function signOut() {
    'use server'
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/login')
  }

  return (
    <>
      <Header title="Ajustes" />
      <div className="px-4 py-4 space-y-3">
        <div className="rounded-xl bg-white border border-gray-100 px-4 py-3">
          <p className="text-xs text-gray-400">Cuenta</p>
          <p className="text-sm font-medium text-gray-900 mt-0.5">{user?.email}</p>
        </div>

        <form action={signOut}>
          <button type="submit" className="w-full rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-100 transition">
            Cerrar sesión
          </button>
        </form>
      </div>
    </>
  )
}
