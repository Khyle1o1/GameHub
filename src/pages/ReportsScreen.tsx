import { useState, useEffect } from 'react';
import { ArrowLeft, Calendar, TrendingUp, DollarSign, ShoppingCart, Clock, RefreshCw, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useNavigate } from 'react-router-dom';
import { usePosStore } from '@/hooks/usePosStore';
import { apiClient } from '@/lib/api';

export default function ReportsScreen() {
  const navigate = useNavigate();
  const { tables, products } = usePosStore();
  
  const [selectedPeriod, setSelectedPeriod] = useState('today');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [reportData, setReportData] = useState({
    totalRevenue: 0,
    timeRevenue: 0,
    productRevenue: 0,
    totalTransactions: 0,
    cashPayments: 0,
    gcashPayments: 0,
    grossIncome: 0,
    totalCOGS: 0,
    netIncome: 0,
    profitMargin: 0,
    topProducts: [] as Array<{ name: string; quantity: number; revenue: number }>,
    tableIncome: [] as Array<{ tableId: number; tableName: string; sessionCount: number; timeRevenue: number; productRevenue: number; totalRevenue: number }>
  });

  // Update current time every second
  useEffect(() => {
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timeInterval);
  }, []);

  // Load real report data
  const loadReportData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const today = new Date().toISOString().split('T')[0];
      let reportResponse;

      if (selectedPeriod === 'today') {
        reportResponse = await apiClient.getDailyReport(today);
      } else if (selectedPeriod === 'week') {
        // Get start of current week (Monday)
        const startOfWeek = new Date();
        const day = startOfWeek.getDay();
        const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
        startOfWeek.setDate(diff);
        const weekStart = startOfWeek.toISOString().split('T')[0];
        reportResponse = await apiClient.getWeeklyReport(weekStart);
      } else if (selectedPeriod === 'month') {
        const now = new Date();
        reportResponse = await apiClient.getMonthlyReport(now.getFullYear(), now.getMonth() + 1);
      } else if (selectedPeriod === 'custom' && customStartDate && customEndDate) {
        // For custom date range, we'll use the product sales report endpoint
        // and aggregate the data manually
        reportResponse = await apiClient.getProductSalesReport(customStartDate, customEndDate);
        
        // Get transactions for the custom period to calculate totals
        const transactionsResponse = await apiClient.getTransactionsByRange(customStartDate, customEndDate);
        
        // Calculate summary data from transactions
        const totalRevenue = transactionsResponse.reduce((sum, t) => sum + parseFloat(t.total_amount), 0);
        const totalTimeRevenue = transactionsResponse.reduce((sum, t) => sum + parseFloat(t.time_cost || 0), 0);
        const totalProductRevenue = transactionsResponse.reduce((sum, t) => sum + parseFloat(t.product_cost || 0), 0);
        const totalTransactions = transactionsResponse.length;
        
        // Calculate payment methods
        const cashPayments = transactionsResponse
          .filter(t => t.payment_method === 'cash')
          .reduce((sum, t) => sum + parseFloat(t.total_amount), 0);
        const gcashPayments = transactionsResponse
          .filter(t => t.payment_method === 'gcash')
          .reduce((sum, t) => sum + parseFloat(t.total_amount), 0);
        
        // Calculate COGS from product data
        const totalCOGS = reportResponse.productData.reduce((sum: number, product: any) => {
          // We need to get the cost from the product data or calculate it
          // For now, we'll estimate COGS as 60% of revenue (typical for retail)
          return sum + (product.totalRevenue * 0.6);
        }, 0);
        
        const grossIncome = totalRevenue;
        const netIncome = grossIncome - totalCOGS;
        const profitMargin = grossIncome > 0 ? ((netIncome / grossIncome) * 100) : 0;
        
        // Get table income data for custom range
        const tableIncomeMap = new Map();
        transactionsResponse.forEach((transaction: any) => {
          if (transaction.table_id) {
            const tableId = transaction.table_id;
            if (!tableIncomeMap.has(tableId)) {
              tableIncomeMap.set(tableId, {
                tableId,
                tableName: `Table ${tableId}`,
                sessionCount: 0,
                timeRevenue: 0,
                productRevenue: 0,
                totalRevenue: 0
              });
            }
            const tableData = tableIncomeMap.get(tableId);
            tableData.sessionCount += 1;
            tableData.timeRevenue += parseFloat(transaction.time_cost || 0);
            tableData.productRevenue += parseFloat(transaction.product_cost || 0);
            tableData.totalRevenue += parseFloat(transaction.total_amount || 0);
          }
        });
        
        const tableIncome = Array.from(tableIncomeMap.values()).sort((a, b) => a.tableId - b.tableId);
        
        // Transform product data
        const topProducts = reportResponse.productData.map((product: any) => ({
          name: product.productName,
          quantity: product.totalQuantity,
          revenue: product.totalRevenue
        }));
        
        reportResponse = {
          summary: {
            totalRevenue,
            totalTimeRevenue,
            totalProductRevenue,
            totalTransactions,
            cashPayments,
            gcashPayments,
            grossIncome,
            totalCOGS,
            netIncome,
            profitMargin
          },
          tableIncome,
          topProducts
        };
      }

        if (reportResponse) {
          setReportData({
            totalRevenue: reportResponse.summary.totalRevenue || 0,
            timeRevenue: reportResponse.summary.totalTimeRevenue || 0,
            productRevenue: reportResponse.summary.totalProductRevenue || 0,
            totalTransactions: reportResponse.summary.totalTransactions || 0,
            cashPayments: reportResponse.summary.cashPayments || 0,
            gcashPayments: reportResponse.summary.gcashPayments || 0,
            grossIncome: reportResponse.summary.grossIncome || 0,
            totalCOGS: reportResponse.summary.totalCOGS || 0,
            netIncome: reportResponse.summary.netIncome || 0,
            profitMargin: reportResponse.summary.profitMargin || 0,
            topProducts: reportResponse.topProducts || [],
            tableIncome: reportResponse.tableIncome || []
          });
        }
    } catch (error) {
      console.error('Error loading report data:', error);
      setError('Failed to load report data. Please try again.');
        // Set empty data on error
        setReportData({
          totalRevenue: 0,
          timeRevenue: 0,
          productRevenue: 0,
          totalTransactions: 0,
          cashPayments: 0,
          gcashPayments: 0,
          grossIncome: 0,
          totalCOGS: 0,
          netIncome: 0,
          profitMargin: 0,
          topProducts: [],
          tableIncome: []
        });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReportData();
  }, [selectedPeriod]);

  // Auto-refresh reports when new transactions are completed
  useEffect(() => {
    const handleTransactionCompleted = () => {
      // Only auto-refresh if we're viewing today's report
      if (selectedPeriod === 'today') {
        loadReportData();
      }
    };

    // Listen for transaction completion events
    const eventSource = new EventSource('http://localhost:3001/events');
    eventSource.addEventListener('transactionCompleted', handleTransactionCompleted);

    return () => {
      eventSource.close();
    };
  }, [selectedPeriod]);

  const formatCurrency = (amount: number) => `₱${amount.toLocaleString()}`;
  const formatDate = (date: Date) => date.toLocaleDateString('en-PH');

  const exportToCSV = () => {
    const periodLabel = selectedPeriod === 'today' ? 'Today' : 
                       selectedPeriod === 'week' ? 'This Week' : 
                       selectedPeriod === 'month' ? 'This Month' : 
                       selectedPeriod === 'custom' ? `${customStartDate} to ${customEndDate}` : 'Period';
    
    const csvContent = [
      ['GameHub Reports', periodLabel, new Date().toLocaleString()],
      [''],
      ['Summary'],
      ['Cash Payments', formatCurrency(reportData.cashPayments)],
      ['GCash Payments', formatCurrency(reportData.gcashPayments)],
      [''],
      ['Financial Summary'],
      ['Gross Income', formatCurrency(reportData.grossIncome)],
      ['Cost of Goods Sold', formatCurrency(reportData.totalCOGS)],
      ['Net Income', formatCurrency(reportData.netIncome)],
      [''],
      ['Top Selling Products'],
      ['Product Name', 'Quantity Sold', 'Revenue'],
      ...reportData.topProducts.map(product => [
        product.name,
        product.quantity.toString(),
        formatCurrency(product.revenue)
      ]),
      [''],
      ['Payment Methods Breakdown'],
      ['Cash', formatCurrency(reportData.cashPayments), `${reportData.totalRevenue > 0 ? Math.round((reportData.cashPayments / reportData.totalRevenue) * 100) : 0}%`],
      ['GCash', formatCurrency(reportData.gcashPayments), `${reportData.totalRevenue > 0 ? Math.round((reportData.gcashPayments / reportData.totalRevenue) * 100) : 0}%`]
    ];

    if (reportData.tableIncome.length > 0) {
      csvContent.push(
        [''],
        ['Table Income Breakdown'],
        ['Table Name', 'Sessions', 'Time Revenue', 'Product Revenue', 'Total Revenue'],
        ...reportData.tableIncome.map(table => [
          table.tableName,
          table.sessionCount.toString(),
          formatCurrency(table.timeRevenue),
          formatCurrency(table.productRevenue),
          formatCurrency(table.totalRevenue)
        ])
      );
    }


    const csvString = csvContent.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `gamehub-report-${periodLabel.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
                <Button
                  variant="outline"
                  onClick={exportToCSV}
                  disabled={loading || reportData.totalTransactions === 0}
                  style={{ 
                    borderColor: '#9B9182', 
                    color: '#E8E0D2',
                    backgroundColor: 'transparent'
                  }}
                  className="hover:bg-opacity-10 hover:bg-white"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
                
                <Button
                  variant="outline"
                  onClick={loadReportData}
                  disabled={loading}
                  style={{ 
                    borderColor: '#9B9182', 
                    color: '#E8E0D2',
                    backgroundColor: 'transparent'
                  }}
                  className="hover:bg-opacity-10 hover:bg-white"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                
                <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                  <SelectTrigger className="w-40" style={{ backgroundColor: '#404750', borderColor: '#9B9182', color: '#E8E0D2' }}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                    <SelectItem value="custom">Custom Range</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {error && (
          <div className="mb-6 p-4 rounded-lg border" style={{ backgroundColor: '#FEF2F2', borderColor: '#FECACA' }}>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-red-500"></div>
              <span className="text-red-800 font-medium">Error</span>
            </div>
            <p className="text-red-700 mt-1">{error}</p>
          </div>
        )}
        
        {loading && (
          <div className="mb-6 p-4 rounded-lg border" style={{ backgroundColor: '#F0F9FF', borderColor: '#BAE6FD' }}>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-blue-500 animate-pulse"></div>
              <span className="text-blue-800 font-medium">Loading report data...</span>
            </div>
          </div>
        )}
        
        {selectedPeriod === 'custom' && (
          <div className="mb-6 p-4 rounded-lg border" style={{ backgroundColor: '#E8E0D2', borderColor: '#9B9182' }}>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Label htmlFor="startDate" className="text-sm font-medium" style={{ color: '#2C313A' }}>
                  Start Date:
                </Label>
                <Input
                  id="startDate"
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  style={{ backgroundColor: '#F5F5F5', borderColor: '#9B9182' }}
                  className="w-40"
                />
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="endDate" className="text-sm font-medium" style={{ color: '#2C313A' }}>
                  End Date:
                </Label>
                <Input
                  id="endDate"
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  style={{ backgroundColor: '#F5F5F5', borderColor: '#9B9182' }}
                  className="w-40"
                />
              </div>
              <Button
                onClick={() => {
                  if (!customStartDate || !customEndDate) {
                    setError('Please select both start and end dates');
                    return;
                  }
                  loadReportData();
                }}
                disabled={loading || !customStartDate || !customEndDate}
                style={{ backgroundColor: '#2C313A', color: '#E8E0D2' }}
                className="hover:bg-opacity-90"
              >
                Generate Report
              </Button>
            </div>
          </div>
        )}
        
        <div className="space-y-6">
          {/* Financial Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="shadow-sm" style={{ backgroundColor: '#E8E0D2', borderColor: '#9B9182' }}>
              <CardHeader className="pb-3" style={{ backgroundColor: '#2C313A' }}>
                <CardTitle className="text-lg text-white font-semibold flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Gross Income
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="text-2xl font-bold" style={{ color: '#2C313A' }}>
                  {formatCurrency(reportData.grossIncome)}
                </div>
                <div className="text-sm" style={{ color: '#404750' }}>
                  Total Sales Revenue
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm" style={{ backgroundColor: '#E8E0D2', borderColor: '#9B9182' }}>
              <CardHeader className="pb-3" style={{ backgroundColor: '#404750' }}>
                <CardTitle className="text-lg text-white font-semibold flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Net Income
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="text-2xl font-bold" style={{ color: reportData.netIncome >= 0 ? '#2C313A' : '#DC2626' }}>
                  {formatCurrency(reportData.netIncome)}
                </div>
                <div className="text-sm" style={{ color: '#404750' }}>
                  After COGS: {formatCurrency(reportData.totalCOGS)}
                </div>
              </CardContent>
            </Card>


            <Card className="shadow-sm" style={{ backgroundColor: '#E8E0D2', borderColor: '#9B9182' }}>
              <CardHeader className="pb-3" style={{ backgroundColor: '#404750' }}>
                <CardTitle className="text-lg text-white font-semibold flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Cost of Goods
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="text-2xl font-bold" style={{ color: '#2C313A' }}>
                  {formatCurrency(reportData.totalCOGS)}
                </div>
                <div className="text-sm" style={{ color: '#404750' }}>
                  {reportData.grossIncome > 0 ? Math.round((reportData.totalCOGS / reportData.grossIncome) * 100) : 0}% of sales
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
                        {reportData.totalRevenue > 0 ? Math.round((reportData.cashPayments / reportData.totalRevenue) * 100) : 0}%
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
                        {reportData.totalRevenue > 0 ? Math.round((reportData.gcashPayments / reportData.totalRevenue) * 100) : 0}%
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
                  {reportData.topProducts.length > 0 ? (
                    reportData.topProducts.map((product, index) => (
                      <div key={index} className="flex items-center justify-between p-2 rounded" style={{ backgroundColor: '#E8E0D2', border: '1px solid #9B9182' }}>
                        <div>
                          <div className="font-medium" style={{ color: '#2C313A' }}>{product.name}</div>
                          <div className="text-sm" style={{ color: '#404750' }}>{product.quantity} sold</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold" style={{ color: '#2C313A' }}>{formatCurrency(product.revenue)}</div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8" style={{ color: '#404750' }}>
                      <ShoppingCart className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>No product sales data available</p>
                      <p className="text-sm mt-1">Products will appear here once sales are recorded</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Table Income Breakdown */}
          {reportData.tableIncome.length > 0 && (
            <Card className="shadow-sm" style={{ backgroundColor: '#E8E0D2', borderColor: '#9B9182' }}>
              <CardHeader style={{ backgroundColor: '#2C313A' }}>
                <CardTitle className="text-lg text-white font-semibold">Table Income Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {reportData.tableIncome.map((table) => (
                    <div key={table.tableId} className="p-4 rounded-lg border" style={{ backgroundColor: '#F5F5F5', borderColor: '#9B9182' }}>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-bold" style={{ color: '#2C313A' }}>
                          {table.tableName}
                        </h3>
                        <div className="text-sm" style={{ color: '#404750' }}>
                          {table.sessionCount} session{table.sessionCount !== 1 ? 's' : ''}
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm" style={{ color: '#404750' }}>Time Revenue:</span>
                          <span className="font-semibold" style={{ color: '#2C313A' }}>
                            {formatCurrency(table.timeRevenue)}
                          </span>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-sm" style={{ color: '#404750' }}>Product Revenue:</span>
                          <span className="font-semibold" style={{ color: '#2C313A' }}>
                            {formatCurrency(table.productRevenue)}
                          </span>
                        </div>
                        
                        <div className="border-t pt-2" style={{ borderColor: '#9B9182' }}>
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium" style={{ color: '#2C313A' }}>Total Revenue:</span>
                            <span className="font-bold text-lg" style={{ color: '#2C313A' }}>
                              {formatCurrency(table.totalRevenue)}
                            </span>
                          </div>
                        </div>
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