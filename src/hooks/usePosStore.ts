import { useState, useEffect } from 'react';
import { PosState, Table, Product } from '@/types/pos';

const STORAGE_KEY = 'billiard-pos-state';
const HOURLY_RATE = 50; // Price per hour

const initialProducts: Product[] = [
  { id: '1', name: 'Softdrink', price: 15, category: 'drink' },
  { id: '2', name: 'Beer', price: 35, category: 'drink' },
  { id: '3', name: 'Water', price: 10, category: 'drink' },
  { id: '4', name: 'Chips', price: 20, category: 'food' },
  { id: '5', name: 'Sandwich', price: 45, category: 'food' },
  { id: '6', name: 'Fries', price: 30, category: 'food' },
];

const initialTables: Table[] = Array.from({ length: 8 }, (_, i) => ({
  id: i + 1,
  name: `Table ${i + 1}`,
  isActive: false,
  startTime: null,
  mode: null,
  orders: [],
}));

export function usePosStore() {
  const [state, setState] = useState<PosState>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    return {
      tables: initialTables,
      products: initialProducts,
      selectedTableId: null,
      hourlyRate: HOURLY_RATE,
    };
  });

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    // Dispatch storage event for cross-tab sync
    window.dispatchEvent(new Event('storage'));
  }, [state]);

  // Listen for storage changes from other tabs
  useEffect(() => {
    const handleStorageChange = () => {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setState(JSON.parse(stored));
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const startTable = (tableId: number, mode: 'open' | 'hour') => {
    setState(prev => ({
      ...prev,
      tables: prev.tables.map(table =>
        table.id === tableId
          ? { ...table, isActive: true, startTime: Date.now(), mode }
          : table
      ),
    }));
  };

  const stopTable = (tableId: number) => {
    setState(prev => ({
      ...prev,
      tables: prev.tables.map(table =>
        table.id === tableId
          ? { ...table, isActive: false, startTime: null, mode: null }
          : table
      ),
    }));
  };

  const addOrder = (tableId: number, productId: string) => {
    const product = state.products.find(p => p.id === productId);
    if (!product) return;

    setState(prev => ({
      ...prev,
      tables: prev.tables.map(table => {
        if (table.id !== tableId) return table;

        const existingOrder = table.orders.find(o => o.productId === productId);
        if (existingOrder) {
          return {
            ...table,
            orders: table.orders.map(o =>
              o.productId === productId
                ? { ...o, quantity: o.quantity + 1 }
                : o
            ),
          };
        } else {
          return {
            ...table,
            orders: [
              ...table.orders,
              {
                productId: product.id,
                productName: product.name,
                price: product.price,
                quantity: 1,
              },
            ],
          };
        }
      }),
    }));
  };

  const removeOrder = (tableId: number, productId: string) => {
    setState(prev => ({
      ...prev,
      tables: prev.tables.map(table => {
        if (table.id !== tableId) return table;

        const existingOrder = table.orders.find(o => o.productId === productId);
        if (!existingOrder) return table;

        if (existingOrder.quantity > 1) {
          return {
            ...table,
            orders: table.orders.map(o =>
              o.productId === productId
                ? { ...o, quantity: o.quantity - 1 }
                : o
            ),
          };
        } else {
          return {
            ...table,
            orders: table.orders.filter(o => o.productId !== productId),
          };
        }
      }),
    }));
  };

  const checkout = (tableId: number) => {
    setState(prev => ({
      ...prev,
      tables: prev.tables.map(table =>
        table.id === tableId
          ? {
              ...table,
              isActive: false,
              startTime: null,
              mode: null,
              orders: [],
            }
          : table
      ),
      selectedTableId: null,
    }));
  };

  const selectTable = (tableId: number | null) => {
    setState(prev => ({ ...prev, selectedTableId: tableId }));
  };

  return {
    state,
    startTable,
    stopTable,
    addOrder,
    removeOrder,
    checkout,
    selectTable,
  };
}
