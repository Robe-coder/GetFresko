export type ProductLocation = 'despensa' | 'nevera' | 'congelador'
export type ProductStatus = 'active' | 'eaten' | 'wasted'
export type ProductUnit = 'unidad' | 'g' | 'kg' | 'ml' | 'l' | 'rebanada' | 'taza'
export type DietType = 'omnivore' | 'vegetarian' | 'vegan' | 'glutenfree'
export type SubscriptionPlan = 'free' | 'premium' | 'family'
export type SubscriptionStatus = 'free' | 'active' | 'past_due' | 'canceled'

export interface UserProduct {
  id: string
  userId: string
  productMasterId?: string
  customName?: string
  quantity: number
  unit: ProductUnit
  location: ProductLocation
  purchaseDate?: string // ISO date
  expiryDate?: string   // ISO date
  isPredicted: boolean
  status: ProductStatus
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface ProductMaster {
  id: string
  name: string
  category: string
  typicalShelfLifeDays?: number
  frozenShelfLifeDays?: number
  fridgeShelfLifeDays?: number
  imageUrl?: string
  createdAt: string
}

export interface RecipeJson {
  title: string
  servings: number
  prepTime: number // minutos
  ingredients: { name: string; amount: string }[]
  steps: string[]
  tips?: string
  difficulty: 'fácil' | 'media' | 'difícil'
}

export interface RecipeCache {
  id: string
  ingredientsHash: string
  dietType: DietType
  language: string
  recipeJson: RecipeJson
  usageCount: number
  createdAt: string
}

export interface WasteStats {
  savedItems: number
  wastedItems: number
  estimatedMoneySaved: number
  currentStreak: number
  longestStreak: number
  totalPoints: number
}

export interface Subscription {
  id: string
  userId: string
  stripeCustomerId?: string
  stripeSubscriptionId?: string
  status: SubscriptionStatus
  plan: SubscriptionPlan
  currentPeriodEnd?: string
  createdAt: string
  updatedAt: string
}

export interface GamificationAction {
  type:
    | 'product_added'
    | 'product_eaten'
    | 'product_wasted'
    | 'ticket_scanned'
    | 'recipe_used'
    | 'streak_milestone'
  points: number
}

export interface Badge {
  id: string
  name: string
  description: string
  emoji: string
  unlockedAt?: string
}

export interface DailyLog {
  id: string
  userId: string
  date: string
  savedCount: number
  wastedCount: number
  moneySaved: number
  pointsEarned: number
  createdAt: string
}

// Plan limits
export const PLAN_LIMITS = {
  free: {
    maxProducts: 20,
    recipesPerWeek: 3,
    ticketScansPerWeek: 1,
  },
  premium: {
    maxProducts: Infinity,
    recipesPerWeek: Infinity,
    ticketScansPerWeek: Infinity,
  },
  family: {
    maxProducts: Infinity,
    recipesPerWeek: Infinity,
    ticketScansPerWeek: Infinity,
  },
} as const

// Gamification points
export const GAMIFICATION_POINTS = {
  product_added: 2,
  product_eaten: 10,
  product_eaten_expiry_day: 5,
  product_wasted: -5,
  ticket_scanned: 8,
  recipe_used: 5,
  streak_7_days: 50,
  streak_30_days: 200,
} as const
