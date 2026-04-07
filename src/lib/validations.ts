import { z } from 'zod'

export const addProductSchema = z.object({
  customName: z.string().min(1, 'El nombre es obligatorio').max(100),
  productMasterId: z.string().uuid().optional(),
  quantity: z.number().positive('La cantidad debe ser mayor que 0').default(1),
  unit: z.enum(['unidad', 'g', 'kg', 'ml', 'l', 'rebanada', 'taza']).default('unidad'),
  location: z.enum(['despensa', 'nevera', 'congelador']).default('despensa'),
  purchaseDate: z.string().optional(), // ISO date YYYY-MM-DD
  expiryDate: z.string().optional(),   // ISO date YYYY-MM-DD
  notes: z.string().max(500).optional(),
})

export const updateProductSchema = addProductSchema.partial().extend({
  id: z.string().uuid(),
  status: z.enum(['active', 'eaten', 'wasted']).optional(),
})

export const recipeRequestSchema = z.object({
  ingredients: z.array(z.string()).min(1, 'Necesitas al menos un ingrediente'),
  dietType: z.enum(['omnivore', 'vegetarian', 'vegan', 'glutenfree']).default('omnivore'),
  language: z.string().default('es'),
})

export type AddProductInput = z.infer<typeof addProductSchema>
export type UpdateProductInput = z.infer<typeof updateProductSchema>
export type RecipeRequestInput = z.infer<typeof recipeRequestSchema>
