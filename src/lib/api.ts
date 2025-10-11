const API_BASE_URL = 'http://localhost:3001/api';

class ApiClient {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // Tables API
  async getTables() {
    return this.request<any[]>('/tables');
  }

  async getTable(id: number) {
    return this.request<any>(`/tables/${id}`);
  }

  async updateTableCount(count: number) {
    return this.request<any>('/tables/count', {
      method: 'POST',
      body: JSON.stringify({ count }),
    });
  }

  async startTableSession(tableId: number, mode: 'open' | 'hour' | 'countdown', duration?: number) {
    return this.request<any>(`/tables/${tableId}/start`, {
      method: 'POST',
      body: JSON.stringify({ mode, duration }),
    });
  }

  async stopTableSession(tableId: number) {
    return this.request<any>(`/tables/${tableId}/stop`, {
      method: 'POST',
    });
  }

  async resetTable(tableId: number) {
    return this.request<any>(`/tables/${tableId}/reset`, {
      method: 'POST',
    });
  }

  async addTimeExtension(tableId: number, duration: number) {
    return this.request<any>(`/tables/${tableId}/extend`, {
      method: 'POST',
      body: JSON.stringify({ duration }),
    });
  }

  // Products API
  async getProducts() {
    return this.request<any[]>('/products');
  }

  async getProductsByCategory(category: string) {
    return this.request<any[]>(`/products/category/${category}`);
  }

  async createProduct(product: { name: string; price: number; cost: number; quantity: number; category: string }) {
    return this.request<any>('/products', {
      method: 'POST',
      body: JSON.stringify(product),
    });
  }

  async updateProduct(id: number, product: { name: string; price: number; cost: number; quantity: number; category: string }) {
    return this.request<any>(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(product),
    });
  }

  async deleteProduct(id: number) {
    return this.request<any>(`/products/${id}`, {
      method: 'DELETE',
    });
  }

  // Orders API
  async getOrdersByTable(tableId: number) {
    return this.request<any[]>(`/orders/table/${tableId}`);
  }

  async getStandaloneOrders() {
    return this.request<any[]>('/orders/standalone');
  }

  async addOrderItem(order: {
    tableId?: number | null;
    productId: number;
    productName: string;
    price: number;
    quantity: number;
  }) {
    return this.request<any>('/orders', {
      method: 'POST',
      body: JSON.stringify(order),
    });
  }

  async updateOrderQuantity(id: number, quantity: number) {
    return this.request<any>(`/orders/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ quantity }),
    });
  }

  async deleteOrderItem(id: number) {
    return this.request<any>(`/orders/${id}`, {
      method: 'DELETE',
    });
  }

  async clearTableOrders(tableId: number) {
    return this.request<any>(`/orders/table/${tableId}/clear`, {
      method: 'DELETE',
    });
  }

  async clearStandaloneOrders() {
    return this.request<any>('/orders/standalone/clear', {
      method: 'DELETE',
    });
  }

  // Transactions API
  async createTransaction(transaction: {
    tableId?: number | null;
    timeCost: number;
    productCost: number;
    totalAmount: number;
    paymentMethod?: string;
    referenceNumber?: string;
  }) {
    return this.request<any>('/transactions', {
      method: 'POST',
      body: JSON.stringify(transaction),
    });
  }

  async getTransactions() {
    return this.request<any[]>('/transactions');
  }

  async getTransactionsByRange(startDate: string, endDate: string) {
    return this.request<any[]>(`/transactions/range?startDate=${startDate}&endDate=${endDate}`);
  }

  async getTransaction(id: number) {
    return this.request<any>(`/transactions/${id}`);
  }

  // Reports API
  async getDailyReport(date: string) {
    return this.request<any>(`/reports/daily/${date}`);
  }

  async getWeeklyReport(startDate: string) {
    return this.request<any>(`/reports/weekly/${startDate}`);
  }

  async getMonthlyReport(year: number, month: number) {
    return this.request<any>(`/reports/monthly/${year}/${month}`);
  }

  async getProductSalesReport(startDate: string, endDate: string) {
    return this.request<any>(`/reports/products/${startDate}/${endDate}`);
  }

  // Settings API
  async getSettings() {
    return this.request<any>('/settings');
  }

  async saveSettings(settings: { hourlyRate: number; halfHourRate: number }) {
    return this.request<any>('/settings', {
      method: 'POST',
      body: JSON.stringify(settings),
    });
  }

  // Sessions API (for enhanced session tracking)
  async createSession(session: {
    tableId: number;
    startTime: string;
    mode: 'open' | 'hour';
  }) {
    return this.request<any>('/sessions', {
      method: 'POST',
      body: JSON.stringify(session),
    });
  }

  async updateSession(id: number, session: {
    endTime?: string;
    durationMinutes?: number;
    totalCost?: number;
  }) {
    return this.request<any>(`/sessions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(session),
    });
  }

  async getSession(id: number) {
    return this.request<any>(`/sessions/${id}`);
  }

  async getSessionsByTable(tableId: number) {
    return this.request<any[]>(`/sessions/table/${tableId}`);
  }

  // Inventory API
  async getInventory() {
    return this.request<any[]>('/inventory');
  }

  async getInventoryByProduct(productId: number) {
    return this.request<any[]>(`/inventory/product/${productId}`);
  }

  async getInventorySummary() {
    return this.request<any[]>('/inventory/summary');
  }

  async adjustInventory(productId: number, quantity: number, changeType: string = 'adjustment') {
    return this.request<any>(`/inventory/adjust/${productId}`, {
      method: 'POST',
      body: JSON.stringify({ quantity, changeType }),
    });
  }
}

export const apiClient = new ApiClient();
