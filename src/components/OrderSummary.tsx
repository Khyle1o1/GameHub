import { Minus, Plus, Receipt } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Table } from '@/types/pos';
import { calculateTimeFee } from '@/utils/timeCalculations';

interface OrderSummaryProps {
  table: Table | null;
  hourlyRate: number;
  onAddOrder: (productId: string) => void;
  onRemoveOrder: (productId: string) => void;
  onCheckout: () => void;
}

export function OrderSummary({
  table,
  hourlyRate,
  onAddOrder,
  onRemoveOrder,
  onCheckout,
}: OrderSummaryProps) {
  if (!table) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-lg">Order Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            Select a table to view orders
          </div>
        </CardContent>
      </Card>
    );
  }

  const timeFee = table.isActive && table.startTime
    ? calculateTimeFee(table.startTime, hourlyRate)
    : 0;

  const ordersTotal = table.orders.reduce(
    (sum, order) => sum + order.price * order.quantity,
    0
  );

  const grandTotal = timeFee + ordersTotal;

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="text-lg">{table.name} - Order Summary</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        <div className="flex-1 space-y-4">
          {/* Time Fee */}
          {table.isActive && (
            <div>
              <div className="font-medium mb-2">Time Fee</div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Hourly Rate: ₱{hourlyRate}/hr</span>
                <span className="font-medium">₱{timeFee}</span>
              </div>
            </div>
          )}

          {/* Orders */}
          {table.orders.length > 0 && (
            <div>
              <div className="font-medium mb-2">Orders</div>
              <div className="space-y-2">
                {table.orders.map(order => (
                  <div
                    key={order.productId}
                    className="flex items-center justify-between p-2 rounded-lg border"
                  >
                    <div className="flex-1">
                      <div className="font-medium text-sm">{order.productName}</div>
                      <div className="text-xs text-muted-foreground">
                        ₱{order.price} × {order.quantity}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onRemoveOrder(order.productId)}
                        className="h-7 w-7 p-0"
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center font-medium">{order.quantity}</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onAddOrder(order.productId)}
                        className="h-7 w-7 p-0"
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                      <span className="w-16 text-right font-medium">
                        ₱{order.price * order.quantity}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {table.orders.length === 0 && !table.isActive && (
            <div className="text-center text-muted-foreground py-8">
              No orders yet
            </div>
          )}
        </div>

        {/* Total & Checkout */}
        <div className="space-y-4 pt-4">
          <Separator />
          <div className="space-y-2">
            {table.isActive && (
              <div className="flex justify-between text-sm">
                <span>Time Fee</span>
                <span>₱{timeFee}</span>
              </div>
            )}
            {table.orders.length > 0 && (
              <div className="flex justify-between text-sm">
                <span>Orders Total</span>
                <span>₱{ordersTotal}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold">
              <span>Grand Total</span>
              <span className="text-primary">₱{grandTotal}</span>
            </div>
          </div>
          <Button
            className="w-full"
            size="lg"
            onClick={onCheckout}
            disabled={grandTotal === 0}
          >
            <Receipt className="h-4 w-4 mr-2" />
            Checkout
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
