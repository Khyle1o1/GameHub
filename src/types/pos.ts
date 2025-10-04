export interface Table {
  id: number;
  name: string;
  isActive: boolean;
  startTime: number | null;
  mode: 'open' | 'hour' | null;
  orders: OrderItem[];
}

export interface Product {
  id: string;
  name: string;
  price: number;
  category: 'drink' | 'food';
}

export interface OrderItem {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
}

export interface PosState {
  tables: Table[];
  products: Product[];
  selectedTableId: number | null;
  hourlyRate: number;
}
