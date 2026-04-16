import Anthropic from '@anthropic-ai/sdk'

export const aiClient = new Anthropic({
  apiKey: 'placeholder', // OpenRouter usa Authorization: Bearer, no x-api-key
  baseURL: 'https://openrouter.ai/api',
  defaultHeaders: {
    'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
    'HTTP-Referer': 'https://getfresko.app',
    'X-Title': 'GetFresko',
  },
})

export const AI_MODELS = {
  recipes: 'anthropic/claude-sonnet-4.5',
  ocr: 'anthropic/claude-haiku-4.5',
} as const

export const AI_PROMPTS = {
  recipe: (ingredients: string, dietType: string) => `
Eres un chef experto. Tu tarea es generar UNA receta real, sabrosa y cocineable.

${ingredients}
Restricción dietética: ${dietType}

REGLAS ESTRICTAS:
1. Usa ÚNICAMENTE los ingredientes de DESPENSA y BÁSICOS listados arriba. Cero excepciones.
2. NO inventes ni añadas ingredientes que no estén en esas dos listas.
3. Prioriza los ingredientes que caducan antes.
4. Si con los ingredientes disponibles NO se puede hacer ninguna receta real y sabrosa, responde SOLO con este JSON: {"insufficient": true, "message": "Con estos ingredientes no es posible hacer una receta completa. Prueba añadiendo más productos a tu despensa."}
5. Si SÍ se puede, responde SOLO con este JSON (sin texto adicional):
{ "title": string, "servings": number, "prepTime": number, "ingredients": [{ "name": string, "amount": string }], "steps": string[], "tips": string, "difficulty": "fácil" | "media" | "difícil" }
`.trim(),

  ocr: () => `
Analiza este ticket de supermercado y extrae los productos comprados.
Responde SOLO con JSON minificado (sin espacios extra): {"productos":[{"nombre":"string","cantidad":number,"precio":number}]}
Reglas: nombres cortos (máx 4 palabras), cantidad y precio numéricos o null, excluye subtotales/impuestos/descuentos.
`.trim(),
} as const
