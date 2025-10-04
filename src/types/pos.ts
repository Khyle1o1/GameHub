export interface Table {
  id: number;
  name: string;
  status: 'available' | 'occupied' | 'stopped';
  isActive: boolean;
  startTime: number | null;
  endTime: number | null;
  mode: 'open' | 'hour' | null;
  sessionId?: number;
  orders?: OrderItem[];
}

export interface Product {
  id: number;
  name: string;
  price: number | string; // Can be number or string from database
  cost: number | string; // Purchase or base cost
  quantity: number; // Current stock count
  category: 'drink' | 'food' | 'accessory' | 'other';
  created_at?: string;
}

export interface Inventory {
  id: number;
  product_id: number;
  product_name: string;
  price: number | string;
  cost: number | string;
  quantity: number;
  category: string;
  change_type: 'add' | 'update' | 'sale' | 'adjustment';
  change_quantity: number;
  created_at: string;
}

export interface OrderItem {
  id?: number;
  productId: number;
  productName: string;
  price: number | string; // Can be number or string from database
  quantity: number;
  tableId: number;
  createdAt?: string;
}

export interface TimeSession {
  id: number;
  tableId: number;
  startTime: string;
  endTime?: string;
  totalMinutes?: number;
  cost?: number;
  mode: 'open' | 'hour';
}

export interface Transaction {
  id: number;
  tableId: number;
  totalAmount: number;
  timeCost: number;
  productCost: number;
  date: string;
  tableName?: string;
}

export interface PosState {
  tables: Table[];
  products: Product[];
  selectedTableId: number | null;
  hourlyRate: number;
}

export interface DailyReport {
  date: string;
  summary: {
    totalRevenue: number;
    totalTimeRevenue: number;
    totalProductRevenue: number;
    totalTransactions: number;
  };
  transactions: Transaction[];
  timeSessions: TimeSession[];
}

export interface WeeklyReport {
  startDate: string;
  endDate: string;
  summary: {
    totalRevenue: number;
    totalTransactions: number;
    averageDailyRevenue: number;
  };
  dailyData: Array<{
    date: string;
    transactionCount: number;
    totalRevenue: number;
    timeRevenue: number;
    productRevenue: number;
  }>;
}

export interface MonthlyReport {
  year: number;
  month: number;
  summary: {
    totalRevenue: number;
    totalTransactions: number;
    averageDailyRevenue: number;
  };
  dailyData: Array<{
    date: string;
    transactionCount: number;
    totalRevenue: number;
    timeRevenue: number;
    productRevenue: number;
  }>;
  weeklyData: Array<{
    weekNumber: number;
    transactionCount: number;
    totalRevenue: number;
    timeRevenue: number;
    productRevenue: number;
  }>;
}
