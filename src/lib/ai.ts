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
Analiza este ticket de supermercado. Para cada línea de producto responde con JSON minificado:
{"productos":[{"nombre":"string","cantidad":number|null,"precio":number|null,"es_comida":bool,"truncado":bool,"ambiguo":bool,"sugerencias":["string"]}]}

Reglas:
- nombre: máx 4 palabras, tal como aparece en el ticket
- es_comida: true solo si es alimento o bebida consumible. false para limpieza, higiene, hogar, etc.
- truncado: true si el nombre parece cortado o abreviado (ej: "LACT S/L", "PCH POLL")
- ambiguo: true si el nombre no identifica claramente el producto (ej: "sin lactosa", "eco", "light")
- sugerencias: si truncado o ambiguo, incluye 1-2 nombres completos probables. Si no, array vacío []
- Excluye subtotales, impuestos, descuentos, tarjetas de fidelización
`.trim(),
} as const
