import { Minus, Plus, Receipt, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Table } from '@/types/pos';
import { usePosStore } from '@/hooks/usePosStore';
import { PaymentModal } from '@/components/PaymentModal';
import { useState } from 'react';

interface OrderSummaryProps {
  table: Table | null;
}

export function OrderSummary({ table }: OrderSummaryProps) {
  const { hourlyRate, updateOrderQuantity, removeOrderItem, checkoutTable, calculateTableTotal, calculateOpenTimeCost } = usePosStore();
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  if (!table) {
    return (
      <Card className="h-full shadow-sm" style={{ backgroundColor: '#E8E0D2', borderColor: '#9B9182' }}>
        <CardHeader style={{ backgroundColor: '#2C313A' }}>
          <CardTitle className="text-lg text-white font-semibold">Order Summary</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#9B9182' }}>
              <span className="text-2xl">📋</span>
            </div>
            <p className="text-lg font-medium" style={{ color: '#2C313A' }}>Select a table to view orders</p>
            <p className="text-sm mt-2" style={{ color: '#404750' }}>Choose a table from the left to start managing orders</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { timeCost, productCost, total } = calculateTableTotal(table.id);

  return (
    <Card className="h-full flex flex-col shadow-sm" style={{ backgroundColor: '#E8E0D2', borderColor: '#9B9182' }}>
      <CardHeader style={{ backgroundColor: '#2C313A' }}>
        <CardTitle className="text-lg text-white font-semibold">{table.name} - Order Summary</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col p-4">
        <div className="flex-1 space-y-4">
          {/* Time Fee */}
          {(table.isActive || table.status === 'stopped') && (
            <div className="p-4 rounded-lg border" style={{ backgroundColor: '#E8E0D2', borderColor: '#9B9182' }}>
              <div className="font-semibold mb-3 flex items-center gap-2" style={{ color: '#2C313A' }}>
                <span className="text-lg">⏱️</span>
                Time Fee
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span style={{ color: '#404750' }}>
                    {table.mode === 'open' ? 'Open Time Rate' : 'Hourly Rate'}: ₱{hourlyRate}/hr
                  </span>
                  <span className="font-semibold" style={{ color: '#2C313A' }}>₱{timeCost.toFixed(2)}</span>
                </div>
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
          {table.orders && table.orders.length > 0 && (
            <div>
              <div className="font-semibold mb-3 flex items-center gap-2" style={{ color: '#2C313A' }}>
                <span className="text-lg">🛒</span>
                Orders
              </div>
              <div className="space-y-3">
                {table.orders.map(order => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-3 rounded-lg border transition-colors"
                    style={{ 
                      borderColor: '#9B9182',
                      backgroundColor: '#E8E0D2'
                    }}
                  >
                    <div className="flex-1">
                      <div className="font-medium text-sm" style={{ color: '#2C313A' }}>{order.productName}</div>
                      <div className="text-xs" style={{ color: '#404750' }}>
                        ₱{Number(order.price).toFixed(2)} × {order.quantity}
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
                        className="h-7 w-7 p-0"
                        style={{ 
                          borderColor: '#9B9182', 
                          color: '#2C313A',
                          backgroundColor: 'transparent'
                        }}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center font-semibold" style={{ color: '#2C313A' }}>{order.quantity}</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          if (order.id) {
                            updateOrderQuantity(order.id, order.quantity + 1);
                          }
                        }}
                        className="h-7 w-7 p-0"
                        style={{ 
                          borderColor: '#9B9182', 
                          color: '#2C313A',
                          backgroundColor: 'transparent'
                        }}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                      <span className="w-16 text-right font-semibold" style={{ color: '#2C313A' }}>
                        ₱{(Number(order.price) * order.quantity).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(!table.orders || table.orders.length === 0) && !table.isActive && table.status !== 'stopped' && (
            <div className="text-center py-8">
              <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3" style={{ backgroundColor: '#9B9182' }}>
                <span className="text-xl">📝</span>
              </div>
              <p className="font-medium" style={{ color: '#2C313A' }}>No orders yet</p>
              <p className="text-sm mt-1" style={{ color: '#404750' }}>Add products to get started</p>
            </div>
          )}
        </div>

        {/* Total & Checkout */}
        <div className="space-y-4 pt-4" style={{ borderTop: '1px solid #9B9182' }}>
          <div className="space-y-3 p-4 rounded-lg border" style={{ backgroundColor: '#E8E0D2', borderColor: '#9B9182' }}>
            {(table.isActive || table.status === 'stopped') && (
              <div className="flex justify-between text-sm">
                <span style={{ color: '#404750' }}>Time Fee</span>
                <span className="font-semibold" style={{ color: '#2C313A' }}>₱{timeCost.toFixed(2)}</span>
              </div>
            )}
            {table.orders && table.orders.length > 0 && (
              <div className="flex justify-between text-sm">
                <span style={{ color: '#404750' }}>Orders Total</span>
                <span className="font-semibold" style={{ color: '#2C313A' }}>₱{productCost.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold pt-2" style={{ borderTop: '1px solid #9B9182' }}>
              <span style={{ color: '#2C313A' }}>Grand Total</span>
              <span style={{ color: '#2C313A' }}>₱{total.toFixed(2)}</span>
            </div>
          </div>
          <Button
            className="w-full text-white font-semibold py-3"
            size="lg"
            onClick={() => setIsPaymentModalOpen(true)}
            disabled={total === 0}
            style={{ 
              backgroundColor: total === 0 ? '#9B9182' : '#404750',
              color: '#E8E0D2'
            }}
          >
            <Receipt className="h-5 w-5 mr-2" />
            Checkout
          </Button>
        </div>
      </CardContent>
      
      {/* Payment Modal */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        table={table}
        totalAmount={total}
        onConfirmPayment={async (paymentMethod, referenceNumber) => {
          await checkoutTable(table.id, paymentMethod, referenceNumber);
        }}
      />
    </Card>
  );
}
