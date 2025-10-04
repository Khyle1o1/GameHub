// WebSocket service - temporarily disabled due to import issues
// Will be re-enabled once socket.io-client is properly installed

class WebSocketService {
  private isConnected = false;

  connect() {
    console.log('WebSocket service disabled - socket.io-client not available');
    this.isConnected = false;
  }

  disconnect() {
    this.isConnected = false;
  }

  // Subscribe to table updates
  onTableUpdate(callback: (data: any) => void) {
    // No-op for now
  }

  // Subscribe to order updates
  onOrderUpdate(callback: (data: any) => void) {
    // No-op for now
  }

  // Subscribe to session updates
  onSessionUpdate(callback: (data: any) => void) {
    // No-op for now
  }

  // Subscribe to product updates
  onProductUpdate(callback: (data: any) => void) {
    // No-op for now
  }

  // Subscribe to settings updates
  onSettingsUpdate(callback: (data: any) => void) {
    // No-op for now
  }

  // Emit table update
  emitTableUpdate(tableId: number, data: any) {
    // No-op for now
  }

  // Emit order update
  emitOrderUpdate(tableId: number, data: any) {
    // No-op for now
  }

  // Emit session update
  emitSessionUpdate(tableId: number, data: any) {
    // No-op for now
  }

  // Emit product update
  emitProductUpdate(data: any) {
    // No-op for now
  }

  // Emit settings update
  emitSettingsUpdate(data: any) {
    // No-op for now
  }

  // Get connection status
  getConnectionStatus() {
    return this.isConnected;
  }

  // Remove all listeners
  removeAllListeners() {
    // No-op for now
  }
}

export const websocketService = new WebSocketService();
