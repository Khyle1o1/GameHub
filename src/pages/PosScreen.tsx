import { Monitor, Loader2, BarChart3, Settings, Clock, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TableCard } from '@/components/TableCard';
import { ProductList } from '@/components/ProductList';
import { OrderSummary } from '@/components/OrderSummary';
import { usePosStore } from '@/hooks/usePosStore';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';

export default function PosScreen() {
  const navigate = useNavigate();
  const { 
    tables, 
    products, 
    comboItems,
    selectedTableId, 
    isLoading, 
    error,
    fetchTables, 
    fetchProducts, 
    fetchComboItems,
    getSelectedTable,
    fetchStandaloneOrders
  } = usePosStore();

  const selectedTable = getSelectedTable();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    fetchTables();
    fetchProducts();
    fetchComboItems();
    fetchStandaloneOrders();
    
    // Update current time every second
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timeInterval);
  }, [fetchTables, fetchProducts, fetchComboItems, fetchStandaloneOrders]);

  if (isLoading && tables.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#E8E0D2' }}>
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" style={{ color: '#2C3035' }} />
          <p style={{ color: '#414A52' }}>Loading POS System...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#E8E0D2' }}>
      {/* Header */}
      <header className="border-b shadow-lg" style={{ backgroundColor: '#2C313A', borderColor: '#404750' }}>
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#404750' }}>
                  <span className="text-white font-bold text-lg">🎱</span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">Billiard Hall POS</h1>
                  <p className="text-sm" style={{ color: '#9B9182' }}>Table & Order Management System</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {/* Date and Time Display */}
              <div className="text-right">
                <div className="flex items-center gap-2 text-white">
                  <Clock className="h-4 w-4" />
                  <div>
                    <div className="text-lg font-bold">
                      {currentTime.toLocaleTimeString()}
                    </div>
                    <div className="text-sm" style={{ color: '#9B9182' }}>
                      {currentTime.toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => navigate('/inventory')}
                  style={{ 
                    borderColor: '#9B9182', 
                    color: '#E8E0D2',
                    backgroundColor: 'transparent'
                  }}
                  className="hover:bg-opacity-10 hover:bg-white"
                >
                  <Package className="h-4 w-4 mr-2" />
                  Inventory
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate('/settings')}
                  style={{ 
                    borderColor: '#9B9182', 
                    color: '#E8E0D2',
                    backgroundColor: 'transparent'
                  }}
                  className="hover:bg-opacity-10 hover:bg-white"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate('/display')}
                  style={{ 
                    borderColor: '#9B9182', 
                    color: '#E8E0D2',
                    backgroundColor: 'transparent'
                  }}
                  className="hover:bg-opacity-10 hover:bg-white"
                >
                  <Monitor className="h-4 w-4 mr-2" />
                  Display Screen
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate('/reports')}
                  style={{ 
                    borderColor: '#9B9182', 
                    color: '#E8E0D2',
                    backgroundColor: 'transparent'
                  }}
                  className="hover:bg-opacity-10 hover:bg-white"
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Reports
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Error Display */}
      {error && (
        <div className="container mx-auto px-6 py-3">
          <div className="px-4 py-3 rounded-lg shadow-sm" style={{ backgroundColor: '#E8E0D2', borderColor: '#9B9182', border: '1px solid', color: '#2C313A' }}>
            {error}
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Tables Grid */}
          <div className="lg:col-span-3 space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-4" style={{ color: '#2C313A' }}>Tables</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {tables.map(table => (
                  <TableCard
                    key={table.id}
                    table={table}
                  />
                ))}
              </div>
            </div>

            {/* Products */}
            <div>
              <h2 className="text-2xl font-bold mb-4" style={{ color: '#2C313A' }}>Products</h2>
              <ProductList
                products={products}
                comboItems={comboItems}
                disabled={false}
              />
            </div>
          </div>

          {/* Order Summary - Sticky on desktop */}
          <div className="lg:col-span-2 lg:sticky lg:top-8 lg:h-fit max-w-sm">
            <OrderSummary
              table={selectedTable}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
