import { Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TableCard } from '@/components/TableCard';
import { ProductList } from '@/components/ProductList';
import { OrderSummary } from '@/components/OrderSummary';
import { usePosStore } from '@/hooks/usePosStore';
import { useNavigate } from 'react-router-dom';

export default function PosScreen() {
  const navigate = useNavigate();
  const { state, startTable, stopTable, addOrder, removeOrder, checkout, selectTable } = usePosStore();

  const selectedTable = state.tables.find(t => t.id === state.selectedTableId) || null;

  const handleAddOrder = (productId: string) => {
    if (state.selectedTableId) {
      addOrder(state.selectedTableId, productId);
    }
  };

  const handleRemoveOrder = (productId: string) => {
    if (state.selectedTableId) {
      removeOrder(state.selectedTableId, productId);
    }
  };

  const handleCheckout = () => {
    if (state.selectedTableId) {
      checkout(state.selectedTableId);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-primary">🎱 Billiard Hall POS</h1>
              <p className="text-sm text-muted-foreground">Table & Order Management</p>
            </div>
            <Button
              variant="outline"
              onClick={() => navigate('/display')}
            >
              <Monitor className="h-4 w-4 mr-2" />
              Display Screen
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Tables Grid */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-xl font-semibold">Tables</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {state.tables.map(table => (
                <TableCard
                  key={table.id}
                  table={table}
                  onStart={(mode) => startTable(table.id, mode)}
                  onStop={() => stopTable(table.id)}
                  onSelect={() => selectTable(table.id)}
                  isSelected={state.selectedTableId === table.id}
                />
              ))}
            </div>

            {/* Products */}
            <div className="pt-4">
              <h2 className="text-xl font-semibold mb-4">Products</h2>
              <ProductList
                products={state.products}
                onAddProduct={handleAddOrder}
                disabled={!state.selectedTableId}
              />
            </div>
          </div>

          {/* Order Summary - Sticky on desktop */}
          <div className="lg:sticky lg:top-6 lg:h-fit">
            <OrderSummary
              table={selectedTable}
              hourlyRate={state.hourlyRate}
              onAddOrder={handleAddOrder}
              onRemoveOrder={handleRemoveOrder}
              onCheckout={handleCheckout}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
