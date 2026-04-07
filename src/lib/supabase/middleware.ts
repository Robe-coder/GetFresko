import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Rutas protegidas
  const protectedPaths = ['/dashboard', '/products', '/recipes', '/stats', '/settings']
  const isProtectedPath = protectedPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path)
  )

  if (!user && isProtectedPath) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Rutas premium — verificar suscripción activa
  const premiumPaths = ['/recipes', '/stats']
  const isPremiumPath = premiumPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path)
  )

  if (user && isPremiumPath) {
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('status, plan')
      .eq('user_id', user.id)
      .single()

    const isPremium =
      subscription?.status === 'active' &&
      (subscription?.plan === 'premium' || subscription?.plan === 'family')

    // En MVP, recetas disponibles para todos — solo bloquear si se activa Stripe
    // TODO semana 4: descomentar el bloqueo
    // if (!isPremium) {
    //   const url = request.nextUrl.clone()
    //   url.pathname = '/pricing'
    //   return NextResponse.redirect(url)
    // }
    void isPremium // evitar warning de variable no usada
  }

  return supabaseResponse
}
