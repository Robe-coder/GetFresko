import Anthropic from '@anthropic-ai/sdk'

export const aiClient = new Anthropic({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: 'https://openrouter.ai/api/v1',
  defaultHeaders: {
    'HTTP-Referer': 'https://getfresko.app',
    'X-Title': 'GetFresko',
  },
})

export const AI_MODELS = {
  recipes: 'anthropic/claude-sonnet-4-6',
  ocr: 'anthropic/claude-haiku-4-5',
} as const

export const AI_PROMPTS = {
  recipe: (ingredients: string, dietType: string) => `
Eres un chef creativo. Dado este inventario de nevera y despensa, genera UNA receta completa.
Ingredientes disponibles: ${ingredients}
Restricción dietética: ${dietType}
Responde SOLO en JSON con esta estructura exacta:
{ "title": string, "servings": number, "prepTime": number, "ingredients": [{ "name": string, "amount": string }], "steps": string[], "tips": string, "difficulty": "fácil" | "media" | "difícil" }
Prioriza los ingredientes que caducan antes.
`.trim(),

  ocr: () => `
Analiza esta foto de ticket de supermercado y extrae los productos comprados.
Responde SOLO en JSON: { "productos": [{ "nombre": string, "cantidad": number, "precio": number }] }
Si no puedes leer algún campo, usa null. No incluyas subtotales ni impuestos.
`.trim(),
} as const
