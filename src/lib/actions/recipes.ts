'use server'

import { createHash } from 'crypto'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { aiClient, AI_MODELS, AI_PROMPTS } from '@/lib/ai'
import { GAMIFICATION_POINTS, type RecipeJson } from '@/types/index'

export type RecipeState = {
  recipe: RecipeJson | null
  error: string | null
  cached: boolean
}

export async function generateRecipe(
  _prevState: RecipeState,
  formData: FormData
): Promise<RecipeState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { recipe: null, error: 'No autenticado', cached: false }

  const dietType = (formData.get('diet_type') as string) || 'omnivore'
  const selectedIds = formData.getAll('product_ids') as string[]
  const basicNames = formData.getAll('basic_names') as string[]

  if (selectedIds.length === 0) {
    return { recipe: null, error: 'Selecciona al menos un ingrediente', cached: false }
  }

  // Fetch selected products
  const { data: products, error: fetchError } = await supabase
    .from('user_products')
    .select('custom_name, expiry_date')
    .in('id', selectedIds)
    .eq('user_id', user.id)
    .eq('status', 'active')

  if (fetchError || !products?.length) {
    return { recipe: null, error: 'No se encontraron los productos seleccionados', cached: false }
  }

  // Build sorted list for deterministic hash (pantry + basics)
  const pantryNames = products.map(p => p.custom_name.toLowerCase().trim()).sort()
  const sortedBasics = [...basicNames].map(b => b.toLowerCase().trim()).sort()
  const sortedNames = [...pantryNames, ...sortedBasics]

  const ingredientsHash = createHash('sha256')
    .update(sortedNames.join(',') + ':' + dietType)
    .digest('hex')

  // 1. Cache lookup
  const { data: cached } = await supabase
    .from('recipes_cache')
    .select('recipe_json')
    .eq('ingredients_hash', ingredientsHash)
    .eq('diet_type', dietType)
    .eq('language', 'es')
    .single()

  if (cached) {
    await supabase.rpc('add_freskopoints', { p_user_id: user.id, p_points: GAMIFICATION_POINTS.recipe_used })
    revalidatePath('/recetas')
    return { recipe: cached.recipe_json as RecipeJson, error: null, cached: true }
  }

  // 2. Generate with AI
  const pantryText = products
    .map(p => {
      const expiry = p.expiry_date ? ` (caduca: ${p.expiry_date})` : ''
      return p.custom_name + expiry
    })
    .join(', ')

  const basicsText = basicNames.length > 0 ? basicNames.join(', ') : 'ninguno'
  const ingredientsText = `DESPENSA: ${pantryText}\nBÁSICOS DISPONIBLES: ${basicsText}`

  let recipe: RecipeJson
  try {
    const message = await aiClient.messages.create({
      model: AI_MODELS.recipes,
      max_tokens: 1500,
      messages: [
        {
          role: 'user',
          content: AI_PROMPTS.recipe(ingredientsText, dietType),
        },
      ],
    })

    const text =
      message.content[0].type === 'text' ? message.content[0].text : ''

    // Strip possible markdown code fences and extract JSON
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    const json = jsonMatch ? jsonMatch[0] : text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()
    const parsed = JSON.parse(json)

    // IA indica que no hay suficientes ingredientes
    if (parsed.insufficient) {
      return { recipe: null, error: parsed.message ?? 'Con estos ingredientes no es posible hacer una receta. Añade más productos a tu despensa.', cached: false }
    }

    recipe = parsed
  } catch (err) {
    console.error('[generateRecipe] AI error:', err)
    return { recipe: null, error: 'Error al generar la receta. Inténtalo de nuevo.', cached: false }
  }

  // 3. Save to cache
  await supabase.from('recipes_cache').insert({
    ingredients_hash: ingredientsHash,
    diet_type: dietType,
    language: 'es',
    recipe_json: recipe,
  })

  // 4. Award points + update streak (best-effort, no lanzar si la función no existe)
  await Promise.allSettled([
    supabase.rpc('add_freskopoints', {
      p_user_id: user.id,
      p_points: GAMIFICATION_POINTS.recipe_used,
    }),
    supabase.rpc('update_streak', { p_user_id: user.id }),
  ])

  revalidatePath('/recetas')
  revalidatePath('/dashboard')
  return { recipe, error: null, cached: false }
}
