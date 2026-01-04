
export interface FoodItem {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

export interface LogEntry {
  id: string;
  timestamp: number;
  date: string; // YYYY-MM-DD
  items: FoodItem[];
  image?: string; // base64
  transcript?: string;
}

export interface UserGoals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

export interface DailyStats {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

export interface User {
  name: string;
  email: string;
  picture: string;
}
