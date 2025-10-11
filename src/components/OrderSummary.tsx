import { Minus, Plus, Receipt, Trash2, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Table } from '@/types/pos';
import { usePosStore } from '@/hooks/usePosStore';
import { PaymentModal } from '@/components/PaymentModal';
import { formatCurrency } from '@/lib/utils';
import { useState } from 'react';

interface OrderSummaryProps {
  table: Table | null;
}

export function OrderSummary({ table }: OrderSummaryProps) {
  const { 
    hourlyRate, 
    standaloneOrders,
    updateOrderQuantity, 
    removeOrderItem, 
    checkoutTable, 
    checkoutStandaloneOrders,
    calculateTableTotal, 
    calculateStandaloneTotal,
    calculateOpenTimeCost,
    setSelectedTable
  } = usePosStore();
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  // Determine if we're showing table orders or standalone orders
  const isTableMode = table !== null;
  const orders = isTableMode ? (table?.orders || []) : standaloneOrders;
  
  let timeCost = 0;
  let productCost = 0;
  let total = 0;
  
  if (isTableMode) {
    const tableTotals = calculateTableTotal(table.id);
    timeCost = tableTotals.timeCost;
    productCost = tableTotals.productCost;
    total = tableTotals.total;
  } else {
    const standaloneTotals = calculateStandaloneTotal();
    productCost = standaloneTotals.productCost;
    total = standaloneTotals.total;
  }

  // Show empty state if no orders
  if (orders.length === 0 && !isTableMode) {
    return (
      <Card className="shadow-sm" style={{ backgroundColor: '#E8E0D2', borderColor: '#9B9182' }}>
        <CardHeader style={{ backgroundColor: '#2C313A' }} className="py-3">
          <CardTitle className="text-base text-white font-semibold">Order Summary</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="text-center py-6">
            <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3" style={{ backgroundColor: '#9B9182' }}>
              <span className="text-lg">🛒</span>
            </div>
            <p className="text-sm font-medium" style={{ color: '#2C313A' }}>No orders yet</p>
            <p className="text-xs mt-1" style={{ color: '#404750' }}>Add products to get started</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm" style={{ backgroundColor: '#E8E0D2', borderColor: '#9B9182' }}>
      <CardHeader style={{ backgroundColor: '#2C313A' }} className="py-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base text-white font-semibold">
            {isTableMode ? `${table.name} - Order Summary` : 'Order Summary'}
          </CardTitle>
          {isTableMode && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setSelectedTable(null)}
              className="h-6 w-6 p-0"
              style={{ 
                borderColor: '#9B9182', 
                color: '#E8E0D2',
                backgroundColor: 'transparent'
              }}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex flex-col p-3">
        <div className="space-y-3">
          {/* Time Fee - Only for table mode */}
          {isTableMode && (table.isActive || table.status === 'stopped' || table.status === 'needs_checkout') && (
            <div className="p-3 rounded-lg border" style={{ backgroundColor: '#E8E0D2', borderColor: '#9B9182' }}>
              <div className="font-semibold mb-2 flex items-center gap-2" style={{ color: '#2C313A' }}>
                <span className="text-base">⏱️</span>
                Time Fee
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span style={{ color: '#404750' }}>
                    {table.mode === 'open' ? 'Open Time Rate' : 
                     table.mode === 'countdown' ? 'Countdown Timer' : 'Hourly Rate'}: ₱{formatCurrency(hourlyRate)}/hr
                  </span>
                  <span className="font-semibold" style={{ color: '#2C313A' }}>₱{formatCurrency(timeCost)}</span>
                </div>
                
                {/* Countdown Mode Details */}
                {table.mode === 'countdown' && (
                  <div className="text-xs p-2 rounded" style={{ backgroundColor: '#9B9182', color: '#E8E0D2' }}>
                    <div className="font-medium mb-1">Countdown Details:</div>
                    <div>Initial Duration: {Math.floor((table.countdownDuration || 0) / 60)} minutes</div>
                    {table.timeExtensions && table.timeExtensions.length > 0 && (
                      <div>
                        Extensions: {table.timeExtensions.length} × {table.timeExtensions.map(ext => Math.floor(ext.addedDuration / 60)).join(', ')} min
                      </div>
                    )}
                  </div>
                )}
                
                {/* Open Time Breakdown */}
                {table.mode === 'open' && table.startTime && (
                  <div className="text-xs p-2 rounded" style={{ backgroundColor: '#9B9182', color: '#E8E0D2' }}>
                    <span className="font-medium">Breakdown:</span> {(() => {
                      // Use endTime if session is stopped, otherwise use current time
                      const endTime = table.endTime || Date.now();
                      const elapsedSeconds = Math.floor((endTime - table.startTime) / 1000);
                      const { breakdown } = calculateOpenTimeCost(elapsedSeconds);
                      return breakdown;
                    })()}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Orders */}
          {orders.length > 0 && (
            <div>
              <div className="font-semibold mb-2 flex items-center gap-2" style={{ color: '#2C313A' }}>
                <span className="text-base">🛒</span>
                Orders
              </div>
              <div className="space-y-2">
                {orders.map(order => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-2 rounded-lg border transition-colors"
                    style={{ 
                      borderColor: '#9B9182',
                      backgroundColor: '#E8E0D2'
                    }}
                  >
                    <div className="flex-1">
                      <div className="font-medium text-xs" style={{ color: '#2C313A' }}>{order.productName}</div>
                      <div className="text-xs" style={{ color: '#404750' }}>
                        ₱{formatCurrency(order.price)} × {order.quantity}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          if (order.id) {
                            if (order.quantity > 1) {
                              updateOrderQuantity(order.id, order.quantity - 1);
                            } else {
                              removeOrderItem(order.id);
                            }
                          }
                        }}
                        className="h-6 w-6 p-0"
                        style={{ 
                          borderColor: '#9B9182', 
                          color: '#2C313A',
                          backgroundColor: 'transparent'
                        }}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-6 text-center font-semibold text-xs" style={{ color: '#2C313A' }}>{order.quantity}</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          if (order.id) {
                            updateOrderQuantity(order.id, order.quantity + 1);
                          }
                        }}
                        className="h-6 w-6 p-0"
                        style={{ 
                          borderColor: '#9B9182', 
                          color: '#2C313A',
                          backgroundColor: 'transparent'
                        }}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                      <span className="w-12 text-right font-semibold text-xs" style={{ color: '#2C313A' }}>
                        ₱{formatCurrency(Number(order.price) * order.quantity)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {orders.length === 0 && (!isTableMode || (!table.isActive && table.status !== 'stopped')) && (
            <div className="text-center py-4">
              <div className="w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2" style={{ backgroundColor: '#9B9182' }}>
                <span className="text-lg">📝</span>
              </div>
              <p className="font-medium text-sm" style={{ color: '#2C313A' }}>No orders yet</p>
              <p className="text-xs mt-1" style={{ color: '#404750' }}>Add products to get started</p>
            </div>
          )}
        </div>

        {/* Total & Checkout - Show if there are orders or active table session */}
        {(orders.length > 0 || (isTableMode && (table.isActive || table.status === 'stopped' || table.status === 'needs_checkout'))) && (
          <div className="space-y-3 pt-3" style={{ borderTop: '1px solid #9B9182' }}>
            <div className="space-y-2 p-3 rounded-lg border" style={{ backgroundColor: '#E8E0D2', borderColor: '#9B9182' }}>
              {isTableMode && (table.isActive || table.status === 'stopped' || table.status === 'needs_checkout') && (
                <div className="flex justify-between text-xs">
                  <span style={{ color: '#404750' }}>Time Fee</span>
                  <span className="font-semibold" style={{ color: '#2C313A' }}>₱{formatCurrency(timeCost)}</span>
                </div>
              )}
              {orders.length > 0 && (
                <div className="flex justify-between text-xs">
                  <span style={{ color: '#404750' }}>Orders Total</span>
                  <span className="font-semibold" style={{ color: '#2C313A' }}>₱{formatCurrency(productCost)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold pt-1" style={{ borderTop: '1px solid #9B9182' }}>
                <span style={{ color: '#2C313A' }}>Grand Total</span>
                <span style={{ color: '#2C313A' }}>₱{formatCurrency(total)}</span>
              </div>
            </div>
            <Button
              className="w-full text-white font-semibold py-2"
              size="sm"
              onClick={() => setIsPaymentModalOpen(true)}
              disabled={total === 0}
              style={{ 
                backgroundColor: total === 0 ? '#9B9182' : '#404750',
                color: '#E8E0D2'
              }}
            >
              <Receipt className="h-4 w-4 mr-2" />
              Checkout
            </Button>
          </div>
        )}
      </CardContent>
      
      {/* Payment Modal */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        table={table}
        totalAmount={total}
        onConfirmPayment={async (paymentMethod, referenceNumber) => {
          if (isTableMode) {
            await checkoutTable(table.id, paymentMethod, referenceNumber);
          } else {
            await checkoutStandaloneOrders(paymentMethod, referenceNumber);
          }
        }}
      />
    </Card>
  );
}
