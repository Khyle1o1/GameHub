import { create } from 'zustand';
import { Table, Product, OrderItem, PosState } from '@/types/pos';
import { apiClient } from '@/lib/api';
import { websocketService } from '@/lib/websocket';

interface PosStore extends PosState {
  isLoading: boolean;
  error: string | null;
  halfHourRate: number;
  setTables: (tables: Table[]) => void;
  setProducts: (products: Product[]) => void;
  setSelectedTable: (tableId: number | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setHourlyRate: (rate: number) => void;
  setHalfHourRate: (rate: number) => void;
  setTableCount: (count: number) => Promise<void>;
  
  // API calls
  fetchTables: () => Promise<void>;
  fetchProducts: () => Promise<void>;
  addOrderItem: (tableId: number, item: Omit<OrderItem, 'id' | 'tableId'>) => Promise<void>;
  updateOrderQuantity: (orderId: number, quantity: number) => Promise<void>;
  removeOrderItem: (orderId: number) => Promise<void>;
  clearTableOrders: (tableId: number) => Promise<void>;
  startTableSession: (tableId: number, mode: 'open' | 'hour') => Promise<void>;
  stopTableSession: (tableId: number) => Promise<void>;
  resetTable: (tableId: number) => Promise<void>;
  checkoutTable: (tableId: number, paymentMethod?: 'cash' | 'gcash', referenceNumber?: string) => Promise<void>;
  saveSettings: (settings: { hourlyRate: number; halfHourRate: number; tableCount?: number }) => Promise<void>;
  
  // Product management
  createProduct: (product: Omit<Product, 'id'>) => Promise<void>;
  updateProduct: (id: number, product: Partial<Product>) => Promise<void>;
  deleteProduct: (id: number) => Promise<void>;
  
  // Helper methods
  getSelectedTable: () => Table | null;
  getTableOrders: (tableId: number) => OrderItem[];
  calculateTableTotal: (tableId: number) => { timeCost: number; productCost: number; total: number };
  calculateOpenTimeCost: (elapsedSeconds: number) => { totalCost: number; breakdown: string };
}

// Load settings from localStorage on initialization
const loadSettings = () => {
  try {
    const savedSettings = localStorage.getItem('posSettings');
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      return {
        hourlyRate: settings.hourlyRate || 150,
        halfHourRate: settings.halfHourRate || 100,
      };
    }
  } catch (error) {
    console.error('Failed to load settings from localStorage:', error);
  }
  return {
    hourlyRate: 150,
    halfHourRate: 100,
  };
};

// Load products from localStorage on initialization
const loadProducts = () => {
  try {
    const savedProducts = localStorage.getItem('posProducts');
    if (savedProducts) {
      return JSON.parse(savedProducts);
    }
  } catch (error) {
    console.error('Failed to load products from localStorage:', error);
  }
  // Default products
  return [
    { id: 1, name: 'Coca Cola', price: 25, cost: 15, quantity: 50, category: 'drink' as const },
    { id: 2, name: 'Pepsi', price: 25, cost: 15, quantity: 50, category: 'drink' as const },
    { id: 3, name: 'Sprite', price: 25, cost: 15, quantity: 50, category: 'drink' as const },
    { id: 4, name: 'Beer', price: 40, cost: 25, quantity: 30, category: 'drink' as const },
    { id: 5, name: 'Water', price: 15, cost: 7.5, quantity: 100, category: 'drink' as const },
    { id: 6, name: 'Chips', price: 30, cost: 18, quantity: 40, category: 'food' as const },
    { id: 7, name: 'Noodles', price: 50, cost: 25, quantity: 25, category: 'food' as const },
    { id: 8, name: 'Sandwich', price: 60, cost: 30, quantity: 20, category: 'food' as const },
    { id: 9, name: 'Pizza Slice', price: 45, cost: 22.5, quantity: 30, category: 'food' as const },
    { id: 10, name: 'Hot Dog', price: 35, cost: 17.5, quantity: 35, category: 'food' as const }
  ];
};

const initialSettings = loadSettings();
const initialProducts = loadProducts();

export const usePosStore = create<PosStore>((set, get) => {
  // Initialize WebSocket connection
  websocketService.connect();
  
  // Set up WebSocket listeners
  websocketService.onTableUpdate((data) => {
    const { tables } = get();
    const updatedTables = tables.map(table => 
      table.id === data.tableId ? { ...table, ...data.data } : table
    );
    set({ tables: updatedTables });
  });

  websocketService.onProductUpdate((data) => {
    set({ products: data });
  });

  websocketService.onSettingsUpdate((data) => {
    set({ 
      hourlyRate: data.hourlyRate,
      halfHourRate: data.halfHourRate
    });
  });

  return {
    tables: [],
    products: initialProducts,
    selectedTableId: null,
    hourlyRate: initialSettings.hourlyRate,
    halfHourRate: initialSettings.halfHourRate,
    isLoading: false,
    error: null,

  setTables: (tables) => set({ tables }),
  setProducts: (products) => set({ products }),
  setSelectedTable: (tableId) => set({ selectedTableId: tableId }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  setHourlyRate: (rate) => set({ hourlyRate: rate }),
  setHalfHourRate: (rate) => set({ halfHourRate: rate }),
  setTableCount: async (count) => {
    try {
      set({ isLoading: true, error: null });
      
      // Update table count via API
      const response = await apiClient.updateTableCount(count);
      
      // Update local state with the response from server
      set({ tables: response.tables, isLoading: false });
    } catch (error) {
      console.error('Failed to update table count:', error);
      
      // Fallback to local update if API fails
      const { tables } = get();
      const newTables = [];
      
      // Create new tables if count increased
      for (let i = 1; i <= count; i++) {
        const existingTable = tables.find(t => t.id === i);
        if (existingTable) {
          newTables.push(existingTable);
        } else {
          newTables.push({
            id: i,
            name: `Table ${i}`,
            status: 'available' as const,
            isActive: false,
            startTime: null,
            mode: null,
            orders: []
          });
        }
      }
      
      set({ tables: newTables, isLoading: false });
    }
  },

  fetchTables: async () => {
    try {
      set({ isLoading: true, error: null });
      const tables = await apiClient.getTables();
      set({ tables, isLoading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to fetch tables', isLoading: false });
    }
  },

  fetchProducts: async () => {
    try {
      set({ isLoading: true, error: null });
      const products = await apiClient.getProducts();
      set({ products, isLoading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to fetch products', isLoading: false });
    }
  },

  addOrderItem: async (tableId, item) => {
    try {
      set({ isLoading: true, error: null });
      await apiClient.addOrderItem({
        tableId,
        productId: item.productId,
        productName: item.productName,
        price: item.price,
        quantity: item.quantity,
      });
      
      // Refresh tables to get updated orders
      await get().fetchTables();
      set({ isLoading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to add order item', isLoading: false });
    }
  },

  updateOrderQuantity: async (orderId, quantity) => {
    try {
      set({ isLoading: true, error: null });
      await apiClient.updateOrderQuantity(orderId, quantity);
      
      // Refresh tables to get updated orders
      await get().fetchTables();
      set({ isLoading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to update order quantity', isLoading: false });
    }
  },

  removeOrderItem: async (orderId) => {
    try {
      set({ isLoading: true, error: null });
      await apiClient.deleteOrderItem(orderId);
      
      // Refresh tables to get updated orders
      await get().fetchTables();
      set({ isLoading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to remove order item', isLoading: false });
    }
  },

  clearTableOrders: async (tableId) => {
    try {
      set({ isLoading: true, error: null });
      await apiClient.clearTableOrders(tableId);
      
      // Refresh tables to get updated orders
      await get().fetchTables();
      set({ isLoading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to clear table orders', isLoading: false });
    }
  },

  startTableSession: async (tableId, mode) => {
    try {
      set({ isLoading: true, error: null });
      await apiClient.startTableSession(tableId, mode);
      
      // Refresh tables to get updated session info
      await get().fetchTables();
      set({ isLoading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to start table session', isLoading: false });
    }
  },

  stopTableSession: async (tableId) => {
    try {
      set({ isLoading: true, error: null });
      await apiClient.stopTableSession(tableId);
      
      // Refresh tables to get updated session info
      await get().fetchTables();
      set({ isLoading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to stop table session', isLoading: false });
    }
  },

  resetTable: async (tableId) => {
    try {
      set({ isLoading: true, error: null });
      await apiClient.resetTable(tableId);
      
      // Refresh tables to get updated session info
      await get().fetchTables();
      set({ isLoading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to reset table', isLoading: false });
    }
  },

  checkoutTable: async (tableId, paymentMethod = 'cash', referenceNumber) => {
    try {
      set({ isLoading: true, error: null });
      const { timeCost, productCost, total } = get().calculateTableTotal(tableId);
      
      await apiClient.createTransaction({
        tableId,
        timeCost,
        productCost,
        totalAmount: total,
        paymentMethod,
        referenceNumber
      });
      
      // Clear selected table and refresh all tables after checkout
      set({ selectedTableId: null });
      await get().fetchTables();
      set({ isLoading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to checkout table', isLoading: false });
      throw error; // Re-throw to handle in component
    }
  },

  getSelectedTable: () => {
    const { tables, selectedTableId } = get();
    return tables.find(table => table.id === selectedTableId) || null;
  },

  getTableOrders: (tableId) => {
    const { tables } = get();
    const table = tables.find(table => table.id === tableId);
    return table?.orders || [];
  },

  calculateTableTotal: (tableId) => {
    const { tables, hourlyRate, halfHourRate } = get();
    const table = tables.find(table => table.id === tableId);
    
    if (!table) return { timeCost: 0, productCost: 0, total: 0 };

    // If table is available (no active or stopped session), return 0
    if (table.status === 'available' && !table.isActive && !table.startTime) {
      return { timeCost: 0, productCost: 0, total: 0 };
    }

    // Calculate time cost
    let timeCost = 0;
    if (table.startTime) {
      // Use endTime if session is stopped, otherwise use current time
      const endTime = table.endTime || Date.now();
      const elapsedSeconds = Math.floor((endTime - table.startTime) / 1000);
      
      if (table.mode === 'open') {
        // Use new Open Time pricing logic
        const { totalCost } = get().calculateOpenTimeCost(elapsedSeconds);
        timeCost = totalCost;
      } else {
        // Use old hourly rate for hour mode
        const elapsedMinutes = Math.ceil(elapsedSeconds / 60);
        timeCost = (elapsedMinutes / 60) * hourlyRate;
      }
    }

    // Calculate product cost
    const productCost = (table.orders || []).reduce((sum, order) => {
      return sum + (Number(order.price) * order.quantity);
    }, 0);

    return {
      timeCost,
      productCost,
      total: timeCost + productCost,
    };
  },

  calculateOpenTimeCost: (elapsedSeconds) => {
    const { hourlyRate, halfHourRate } = get();
    const totalMinutes = Math.floor(elapsedSeconds / 60);
    
    // Open Time Rate Logic:
    // 0-30 mins: ₱100 (halfHourRate)
    // 31-60 mins: ₱150 (hourlyRate)
    // Beyond first hour: Every completed 30-min block alternates between adding ₱100 and ₱50
    
    let totalCost = 0;
    let breakdown = '';
    
    if (totalMinutes < 31) {
      // First 30 minutes
      totalCost = halfHourRate;
      breakdown = `0-30min ₱${halfHourRate}`;
    } else if (totalMinutes < 61) {
      // 31-60 minutes (first hour)
      totalCost = hourlyRate;
      breakdown = `First hour ₱${hourlyRate}`;
    } else {
      // Beyond first hour
      totalCost = hourlyRate; // First hour costs ₱150
      const minutesBeyondFirstHour = totalMinutes - 60;
      
      // Count completed 30-minute blocks beyond the first hour
      const completed30MinBlocks = Math.floor(minutesBeyondFirstHour / 30);
      
      // Each block alternates: ₱100, ₱50, ₱100, ₱50, etc.
      for (let i = 0; i < completed30MinBlocks; i++) {
        if (i % 2 === 0) {
          totalCost += halfHourRate; // ₱100
        } else {
          totalCost += (hourlyRate - halfHourRate); // ₱50
        }
      }
      
      // Build breakdown string
      const fullHours = Math.floor(totalMinutes / 60);
      const extraBlocks = completed30MinBlocks;
      
      if (extraBlocks === 0) {
        breakdown = `${fullHours} hr ₱${hourlyRate}`;
      } else if (extraBlocks === 1) {
        breakdown = `${fullHours} hr ₱${hourlyRate} + 30min ₱${halfHourRate}`;
      } else {
        const additionalHours = Math.floor(extraBlocks / 2);
        const extraHalfHour = extraBlocks % 2;
        
        breakdown = `${fullHours} hr ₱${hourlyRate}`;
        if (additionalHours > 0) {
          breakdown += ` + ${additionalHours} hr ₱${hourlyRate}`;
        }
        if (extraHalfHour > 0) {
          breakdown += ` + 30min ₱${halfHourRate}`;
        }
      }
    }
    
    return {
      totalCost: Math.round(totalCost * 100) / 100, // Round to 2 decimal places
      breakdown
    };
  },

  saveSettings: async (settings) => {
    try {
      set({ isLoading: true, error: null });
      
      // Save to localStorage
      localStorage.setItem('posSettings', JSON.stringify(settings));
      
      // Update store
      set({ 
        hourlyRate: settings.hourlyRate,
        halfHourRate: settings.halfHourRate,
        isLoading: false 
      });
      
      // Update table count if provided
      if (settings.tableCount) {
        await get().setTableCount(settings.tableCount);
      }
      
      // Try to save to backend API if connected
      try {
        await apiClient.saveSettings(settings);
      } catch (apiError) {
        // If API fails, settings are still saved locally
        console.warn('Failed to save settings to backend, using local storage only:', apiError);
      }
      
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to save settings', isLoading: false });
    }
  },

  // Product management methods
  createProduct: async (product) => {
    try {
      set({ isLoading: true, error: null });
      
      // Try to create via API first
      try {
        const newProduct = await apiClient.createProduct(product);
        const { products } = get();
        set({ products: [...products, newProduct], isLoading: false });
      } catch (apiError) {
        // Fallback to local storage
        const { products } = get();
        const newProduct = {
          ...product,
          id: Math.max(...products.map(p => p.id), 0) + 1
        };
        set({ products: [...products, newProduct], isLoading: false });
        
        // Save to localStorage
        localStorage.setItem('posProducts', JSON.stringify([...products, newProduct]));
      }
      
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to create product', isLoading: false });
    }
  },

  updateProduct: async (id, product) => {
    try {
      set({ isLoading: true, error: null });
      
      // Try to update via API first
      try {
        const updatedProduct = await apiClient.updateProduct(id, product);
        const { products } = get();
        set({ 
          products: products.map(p => p.id === id ? updatedProduct : p), 
          isLoading: false 
        });
      } catch (apiError) {
        // Fallback to local storage
        const { products } = get();
        set({ 
          products: products.map(p => p.id === id ? { ...p, ...product } : p), 
          isLoading: false 
        });
        
        // Save to localStorage
        const updatedProducts = products.map(p => p.id === id ? { ...p, ...product } : p);
        localStorage.setItem('posProducts', JSON.stringify(updatedProducts));
      }
      
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to update product', isLoading: false });
    }
  },

  deleteProduct: async (id) => {
    try {
      set({ isLoading: true, error: null });
      
      // Try to delete via API first
      try {
        await apiClient.deleteProduct(id);
        const { products } = get();
        set({ products: products.filter(p => p.id !== id), isLoading: false });
      } catch (apiError) {
        // Fallback to local storage
        const { products } = get();
        set({ products: products.filter(p => p.id !== id), isLoading: false });
        
        // Save to localStorage
        const updatedProducts = products.filter(p => p.id !== id);
        localStorage.setItem('posProducts', JSON.stringify(updatedProducts));
      }
      
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to delete product', isLoading: false });
    }
  },
  };
});