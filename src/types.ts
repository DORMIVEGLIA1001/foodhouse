export interface Review {
  id: string;
  name: string;
  rating: number;
  text: string;
  date: string;
}

export interface Dish {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: 'main' | 'starter' | 'drink' | 'dessert';
  rating: number;
  ingredients?: string[];
  instructions?: string[];
  isAvailable?: boolean;
  nutrition?: {
    calories: number;
    protein: string;
    carbs: string;
    fat: string;
  };
  reviews?: Review[];
}

export type DeliveryType = 'delivery' | 'dine_in';

export interface OrderItem {
  dishId: string;
  name: string;
  price: number;
  quantity: number;
}

export interface Order {
  id: string;
  items: OrderItem[];
  total: number;
  customerName: string;
  phoneNumber: string;
  customerEmail?: string;
  address?: string;
  deliveryType: DeliveryType;
  trackingStatus: 'pending' | 'preparing' | 'shipping' | 'delivered' | 'cancelled';
  paymentMethod: 'cash' | 'momo' | 'zalopay';
  paymentStatus: 'unpaid' | 'paid';
  driverLocation?: { lat: number; lng: number };
  manualDriverStep?: number;
  createdAt: string;
  callStatus?: 'idle' | 'calling' | 'ringing' | 'answered' | 'confirmed' | 'cancelled' | 'failed' | 'no-answer';
  callSid?: string;
  callLog?: string[];
  emailConfirmation?: {
    success: boolean;
    provider?: string;
    id?: string;
    error?: string;
  };
}

export interface Reservation {
  id: string;
  customerName: string;
  phoneNumber: string;
  numberOfGuests: number;
  reservationTime: string; // ISO format or string time
  tableNumber: number;
  sittingArea?: string;
  status: 'confirmed' | 'cancelled';
  createdAt: string;
}

export interface UserPreferences {
  dietaryNotes: string;
  favorites: string[]; // Dish names or tags
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant' | 'system';
  text: string;
  timestamp: string;
  isAction?: boolean;
  actionData?: ChatAction[];
}

export interface ChatAction {
  type: 'placeOrder' | 'orderStatus' | 'payOrder' | 'cancelOrder' | 'bookTable' | 'updatePreferences' | string;
  order?: Order;
  reservation?: Reservation;
  preferences?: UserPreferences;
}

export interface AppUser {
  username: string;
  fullName: string;
  phoneNumber: string;
  address?: string;
  role: 'customer' | 'restaurant' | 'shipper';
  avatar?: string;
  provider?: 'local' | 'google' | 'facebook';
}
