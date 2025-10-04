import { useState, useEffect } from 'react';
import { ArrowLeft, Calendar, TrendingUp, DollarSign, ShoppingCart, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useNavigate } from 'react-router-dom';
import { usePosStore } from '@/hooks/usePosStore';

export default function ReportsScreen() {
  const navigate = useNavigate();
  const { tables, products } = usePosStore();
  
  const [selectedPeriod, setSelectedPeriod] = useState('today');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [reportData, setReportData] = useState({
    totalRevenue: 0,
    timeRevenue: 0,
    productRevenue: 0,
    totalTransactions: 0,
    cashPayments: 0,
    gcashPayments: 0,
    topProducts: [] as Array<{ name: string; quantity: number; revenue: number }>,
    hourlyData: [] as Array<{ hour: string; revenue: number }>
  });

  // Update current time every second
  useEffect(() => {
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timeInterval);
  }, []);

  // Mock data generation for demonstration
  useEffect(() => {
    const generateMockData = () => {
      const today = new Date();
      const isToday = selectedPeriod === 'today';
      
      // Generate mock revenue data
      const baseRevenue = isToday ? 2500 : selectedPeriod === 'week' ? 17500 : 70000;
      const timeRevenue = baseRevenue * 0.7;
      const productRevenue = baseRevenue * 0.3;
      
      // Generate mock payment data
      const cashPayments = baseRevenue * 0.6;
      const gcashPayments = baseRevenue * 0.4;
      
      // Generate mock top products
      const topProducts = products.slice(0, 5).map((product, index) => ({
        name: product.name,
        quantity: Math.floor(Math.random() * 20) + 5,
        revenue: Math.floor(Math.random() * 500) + 100
      }));
      
      // Generate hourly data for today
      const hourlyData = isToday ? Array.from({ length: 12 }, (_, i) => ({
        hour: `${i + 8}:00`,
        revenue: Math.floor(Math.random() * 300) + 50
      })) : [];
      
      setReportData({
        totalRevenue: baseRevenue,
        timeRevenue,
        productRevenue,
        totalTransactions: Math.floor(baseRevenue / 150) + Math.floor(Math.random() * 10),
        cashPayments,
        gcashPayments,
        topProducts,
        hourlyData
      });
    };
    
    generateMockData();
  }, [selectedPeriod, products]);

  const formatCurrency = (amount: number) => `₱${amount.toLocaleString()}`;
  const formatDate = (date: Date) => date.toLocaleDateString('en-PH');

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#E8E0D2' }}>
      {/* Header */}
      <header className="border-b shadow-lg" style={{ backgroundColor: '#2C313A', borderColor: '#404750' }}>
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={() => navigate('/')}
                style={{ 
                  borderColor: '#9B9182', 
                  color: '#E8E0D2',
                  backgroundColor: 'transparent'
                }}
                className="hover:bg-opacity-10 hover:bg-white"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to POS
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-white">Reports & Analytics</h1>
                <p className="text-sm" style={{ color: '#9B9182' }}>Business insights and performance metrics</p>
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
              
              <div className="flex items-center gap-3">
                <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                  <SelectTrigger className="w-40" style={{ backgroundColor: '#404750', borderColor: '#9B9182', color: '#E8E0D2' }}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="shadow-sm" style={{ backgroundColor: '#E8E0D2', borderColor: '#9B9182' }}>
              <CardHeader className="pb-3" style={{ backgroundColor: '#2C313A' }}>
                <CardTitle className="text-lg text-white font-semibold flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Total Revenue
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="text-2xl font-bold" style={{ color: '#2C313A' }}>
                  {formatCurrency(reportData.totalRevenue)}
                </div>
                <div className="text-sm" style={{ color: '#404750' }}>
                  {selectedPeriod === 'today' ? 'Today' : selectedPeriod === 'week' ? 'This Week' : 'This Month'}
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm" style={{ backgroundColor: '#E8E0D2', borderColor: '#9B9182' }}>
              <CardHeader className="pb-3" style={{ backgroundColor: '#404750' }}>
                <CardTitle className="text-lg text-white font-semibold flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Time Revenue
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="text-2xl font-bold" style={{ color: '#2C313A' }}>
                  {formatCurrency(reportData.timeRevenue)}
                </div>
                <div className="text-sm" style={{ color: '#404750' }}>
                  {Math.round((reportData.timeRevenue / reportData.totalRevenue) * 100)}% of total
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm" style={{ backgroundColor: '#E8E0D2', borderColor: '#9B9182' }}>
              <CardHeader className="pb-3" style={{ backgroundColor: '#2C313A' }}>
                <CardTitle className="text-lg text-white font-semibold flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Product Revenue
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="text-2xl font-bold" style={{ color: '#2C313A' }}>
                  {formatCurrency(reportData.productRevenue)}
                </div>
                <div className="text-sm" style={{ color: '#404750' }}>
                  {Math.round((reportData.productRevenue / reportData.totalRevenue) * 100)}% of total
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm" style={{ backgroundColor: '#E8E0D2', borderColor: '#9B9182' }}>
              <CardHeader className="pb-3" style={{ backgroundColor: '#404750' }}>
                <CardTitle className="text-lg text-white font-semibold flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Transactions
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="text-2xl font-bold" style={{ color: '#2C313A' }}>
                  {reportData.totalTransactions}
                </div>
                <div className="text-sm" style={{ color: '#404750' }}>
                  {formatCurrency(reportData.totalRevenue / reportData.totalTransactions)} avg
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Payment Methods Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="shadow-sm" style={{ backgroundColor: '#E8E0D2', borderColor: '#9B9182' }}>
              <CardHeader style={{ backgroundColor: '#2C313A' }}>
                <CardTitle className="text-lg text-white font-semibold">Payment Methods</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: '#E8E0D2', border: '1px solid #9B9182' }}>
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#2C313A' }}></div>
                      <span className="font-medium" style={{ color: '#2C313A' }}>Cash</span>
                    </div>
                    <div className="text-right">
                      <div className="font-bold" style={{ color: '#2C313A' }}>{formatCurrency(reportData.cashPayments)}</div>
                      <div className="text-sm" style={{ color: '#404750' }}>
                        {Math.round((reportData.cashPayments / reportData.totalRevenue) * 100)}%
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: '#E8E0D2', border: '1px solid #9B9182' }}>
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#404750' }}></div>
                      <span className="font-medium" style={{ color: '#2C313A' }}>GCash</span>
                    </div>
                    <div className="text-right">
                      <div className="font-bold" style={{ color: '#2C313A' }}>{formatCurrency(reportData.gcashPayments)}</div>
                      <div className="text-sm" style={{ color: '#404750' }}>
                        {Math.round((reportData.gcashPayments / reportData.totalRevenue) * 100)}%
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm" style={{ backgroundColor: '#E8E0D2', borderColor: '#9B9182' }}>
              <CardHeader style={{ backgroundColor: '#404750' }}>
                <CardTitle className="text-lg text-white font-semibold">Top Selling Products</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-3">
                  {reportData.topProducts.map((product, index) => (
                    <div key={index} className="flex items-center justify-between p-2 rounded" style={{ backgroundColor: '#E8E0D2', border: '1px solid #9B9182' }}>
                      <div>
                        <div className="font-medium" style={{ color: '#2C313A' }}>{product.name}</div>
                        <div className="text-sm" style={{ color: '#404750' }}>{product.quantity} sold</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold" style={{ color: '#2C313A' }}>{formatCurrency(product.revenue)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Hourly Revenue Chart (for today only) */}
          {selectedPeriod === 'today' && (
            <Card className="shadow-sm" style={{ backgroundColor: '#E8E0D2', borderColor: '#9B9182' }}>
              <CardHeader style={{ backgroundColor: '#2C313A' }}>
                <CardTitle className="text-lg text-white font-semibold">Hourly Revenue - Today</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {reportData.hourlyData.map((hour, index) => (
                    <div key={index} className="flex items-center gap-4">
                      <div className="w-16 text-sm font-medium" style={{ color: '#2C313A' }}>
                        {hour.hour}
                      </div>
                      <div className="flex-1">
                        <div className="h-4 rounded" style={{ backgroundColor: '#9B9182' }}>
                          <div 
                            className="h-4 rounded" 
                            style={{ 
                              backgroundColor: '#404750',
                              width: `${(hour.revenue / Math.max(...reportData.hourlyData.map(h => h.revenue))) * 100}%`
                            }}
                          ></div>
                        </div>
                      </div>
                      <div className="w-20 text-right text-sm font-medium" style={{ color: '#2C313A' }}>
                        {formatCurrency(hour.revenue)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Table Performance */}
          <Card className="shadow-sm" style={{ backgroundColor: '#E8E0D2', borderColor: '#9B9182' }}>
            <CardHeader style={{ backgroundColor: '#2C313A' }}>
              <CardTitle className="text-lg text-white font-semibold">Table Performance</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
                {tables.map(table => (
                  <div key={table.id} className="text-center p-3 rounded-lg" style={{ backgroundColor: '#E8E0D2', border: '1px solid #9B9182' }}>
                    <div className="font-bold text-lg" style={{ color: '#2C313A' }}>{table.name}</div>
                    <div className="text-sm" style={{ color: '#404750' }}>
                      {table.isActive ? 'Active' : 'Available'}
                    </div>
                    <div className="text-xs mt-1" style={{ color: '#404750' }}>
                      {table.isActive ? 'Running' : 'Idle'}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}