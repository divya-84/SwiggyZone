export enum UserRole {
  CUSTOMER = 'CUSTOMER',
  DELIVERY_PARTNER = 'DELIVERY_PARTNER',
  RESTAURANT_OWNER = 'RESTAURANT_OWNER',
  ADMIN = 'ADMIN',
}

export interface Address {
  id: string;
  label: string; // e.g. "Home", "Office"
  street: string;
  city: string;
  state: string;
  zipCode: string;
  latitude: number;
  longitude: number;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  role: UserRole;
  addresses: Address[];
  createdAt: Date;
  updatedAt: Date;
}

export enum CuisineType {
  BIRYANI = 'Biryani',
  BURGER = 'Burger',
  PIZZA = 'Pizza',
  CHINESE = 'Chinese',
  DESSERTS = 'Desserts',
  INDIAN = 'North Indian',
  SOUTH_INDIAN = 'South Indian',
  HEALTHY = 'Healthy Salad',
}

export interface Restaurant {
  id: string;
  name: string;
  description: string;
  coverImage: string;
  rating: number;
  deliveryTimeMinutes: number;
  cuisines: CuisineType[];
  costForTwo: number;
  isActive: boolean;
  latitude: number;
  longitude: number;
  createdAt: Date;
  updatedAt: Date;
}

export enum DietaryTag {
  VEG = 'Veg',
  NON_VEG = 'Non-Veg',
  VEGAN = 'Vegan',
  GLUTEN_FREE = 'Gluten-Free',
  KETO = 'Keto',
  SPICY = 'Spicy',
  HIGH_PROTEIN = 'High Protein',
  LOW_CARB = 'Low Carb',
}

export interface NutritionalInfo {
  calories: number; // kcal
  protein: number; // g
  carbohydrates: number; // g
  fats: number; // g
}

export interface Dish {
  id: string;
  restaurantId: string;
  name: string;
  description: string;
  price: number;
  image?: string;
  dietaryTags: DietaryTag[];
  nutritionalInfo: NutritionalInfo;
  isAvailable: boolean;
  isCustomizable: boolean;
}

export interface CartItem {
  dish: Dish;
  quantity: number;
  customizationNotes?: string;
}

export interface Cart {
  restaurantId?: string;
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  tax: number;
  discount: number;
  total: number;
  appliedCoupon?: string;
}

export enum OrderStatus {
  PLACED = 'PLACED',
  ACCEPTED = 'ACCEPTED',
  PREPARING = 'PREPARING',
  READY = 'READY',
  PICKED_UP = 'PICKED_UP',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
}

export interface DeliveryAgent {
  id: string;
  name: string;
  phone: string;
  latitude: number;
  longitude: number;
}

export interface ETAConfidence {
  etaMinutes: number;
  preparationConfidence: number; // percentage (0-100)
  trafficConfidence: number; // percentage (0-100)
  weatherConfidence: number; // percentage (0-100)
  overallConfidence: number; // percentage (0-100)
  factors: string[]; // reasons like "Peak Traffic hours", "Rainy weather"
}

export interface Order {
  id: string;
  userId: string;
  restaurantId: string;
  restaurantName: string;
  items: CartItem[];
  status: OrderStatus;
  subtotal: number;
  deliveryFee: number;
  tax: number;
  discount: number;
  total: number;
  deliveryAddress: Address;
  deliveryAgent?: DeliveryAgent;
  etaConfidence: ETAConfidence;
  createdAt: Date;
  updatedAt: Date;
}

// AI Interfaces
export interface AIChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: Date;
  recommendedItems?: Dish[];
}

export interface AISearchResponse {
  query: string;
  parsedPreferences: {
    maxCalories?: number;
    dietaryRestrictions: DietaryTag[];
    cuisinePreferences: CuisineType[];
    maxPrice?: number;
  };
  recommendedDishes: Dish[];
  explanation: string;
}

export interface AICustomMenuConfig {
  dietaryRestriction: DietaryTag;
  intensity: 'strict' | 'moderate';
}
