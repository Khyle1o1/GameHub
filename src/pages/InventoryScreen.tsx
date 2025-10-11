import { useState, useEffect } from 'react';
import { ArrowLeft, Package, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Plus, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNavigate } from 'react-router-dom';
import { usePosStore } from '@/hooks/usePosStore';
import { Product } from '@/types/pos';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import ComboManagement from '@/components/ComboManagement';

export default function InventoryScreen() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { products, fetchProducts, createProduct, updateProduct, deleteProduct } = usePosStore();
  
  const [currentTime, setCurrentTime] = useState(new Date());
  const [inventorySummary, setInventorySummary] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [stockFilter, setStockFilter] = useState<string>('all');
  
  // Product management states
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState({
    name: '',
    price: 0,
    cost: 0,
    quantity: 0,
    category: 'drink' as 'drink' | 'food' | 'accessory' | 'other'
  });

  useEffect(() => {
    fetchProducts();
    fetchInventorySummary();
    
    // Update current time every second
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timeInterval);
  }, [fetchProducts]);

  const fetchInventorySummary = async () => {
    try {
      setIsLoading(true);
      const summary = await apiClient.getInventorySummary();
      setInventorySummary(summary);
    } catch (error) {
      console.error('Error fetching inventory summary:', error);
      toast({
        title: "Error",
        description: "Failed to fetch inventory data.",
        variant: "destructive",
        duration: 4000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleProductSubmit = async () => {
    // Validation
    if (!productForm.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Product name is required.",
        variant: "destructive",
        duration: 4000,
      });
      return;
    }

    if (productForm.price <= 0) {
      toast({
        title: "Validation Error",
        description: "Price must be greater than 0.",
        variant: "destructive",
        duration: 4000,
      });
      return;
    }

    if (productForm.cost < 0) {
      toast({
        title: "Validation Error",
        description: "Cost cannot be negative.",
        variant: "destructive",
        duration: 4000,
      });
      return;
    }

    if (productForm.quantity < 0) {
      toast({
        title: "Validation Error",
        description: "Quantity cannot be negative.",
        variant: "destructive",
        duration: 4000,
      });
      return;
    }

    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, productForm);
        toast({
          title: "Product Updated Successfully!",
          description: `${productForm.name} has been updated.`,
          duration: 3000,
        });
      } else {
        await createProduct(productForm);
        toast({
          title: "Product Added Successfully!",
          description: `${productForm.name} has been added to your inventory.`,
          duration: 3000,
        });
      }
      setIsProductDialogOpen(false);
      setEditingProduct(null);
      setProductForm({ name: '', price: 0, cost: 0, quantity: 0, category: 'drink' });
      await fetchInventorySummary();
    } catch (error: any) {
      console.error('Failed to save product:', error);
      
      if (error.message?.includes('409') || error.message?.includes('already exists')) {
        toast({
          title: "Duplicate Product",
          description: "A product with this name already exists. Please choose a different name.",
          variant: "destructive",
          duration: 4000,
        });
      } else {
        toast({
          title: "Failed to Save Product",
          description: "There was an error saving the product. Please try again.",
          variant: "destructive",
          duration: 4000,
        });
      }
    }
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      price: Number(product.price),
      cost: Number(product.cost || 0),
      quantity: Number(product.quantity || 0),
      category: product.category
    });
    setIsProductDialogOpen(true);
  };

  const handleDeleteProduct = async (productId: number) => {
    const product = products.find(p => p.id === productId);
    if (window.confirm(`Are you sure you want to delete "${product?.name}"?`)) {
      try {
        await deleteProduct(productId);
        toast({
          title: "Product Deleted",
          description: `${product?.name} has been removed from inventory.`,
          duration: 3000,
        });
        await fetchInventorySummary();
      } catch (error) {
        console.error('Error deleting product:', error);
        toast({
          title: "Error",
          description: "Failed to delete product. Please try again.",
          variant: "destructive",
          duration: 4000,
        });
      }
    }
  };

  const getStockStatus = (quantity: number) => {
    if (quantity <= 0) return { status: 'out_of_stock', color: 'destructive', icon: AlertTriangle };
    if (quantity <= 10) return { status: 'low_stock', color: 'secondary', icon: TrendingDown };
    return { status: 'in_stock', color: 'default', icon: CheckCircle };
  };

  const filteredProducts = inventorySummary.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
    const matchesStock = stockFilter === 'all' || product.stock_status === stockFilter;
    return matchesSearch && matchesCategory && matchesStock;
  });

  const totalValue = filteredProducts.reduce((sum, product) => 
    sum + (Number(product.cost) * Number(product.quantity)), 0
  );

  const lowStockCount = inventorySummary.filter(p => p.stock_status === 'low_stock').length;
  const outOfStockCount = inventorySummary.filter(p => p.stock_status === 'out_of_stock').length;

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#E8E0D2' }}>
      {/* Header */}
      <header className="border-b" style={{ backgroundColor: '#404750', borderColor: '#9B9182' }}>
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/')}
                className="text-white hover:bg-white/10"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to POS
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                  <Package className="h-6 w-6" />
                  Inventory Management
                </h1>
                <p className="text-sm text-gray-300">
                  {currentTime.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card style={{ backgroundColor: '#E8E0D2', borderColor: '#9B9182' }}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium" style={{ color: '#404750' }}>Total Products</p>
                  <p className="text-2xl font-bold" style={{ color: '#2C313A' }}>{inventorySummary.length}</p>
                </div>
                <Package className="h-8 w-8" style={{ color: '#404750' }} />
              </div>
            </CardContent>
          </Card>

          <Card style={{ backgroundColor: '#E8E0D2', borderColor: '#9B9182' }}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium" style={{ color: '#404750' }}>Total Value</p>
                  <p className="text-2xl font-bold" style={{ color: '#2C313A' }}>₱{formatCurrency(totalValue)}</p>
                </div>
                <TrendingUp className="h-8 w-8" style={{ color: '#404750' }} />
              </div>
            </CardContent>
          </Card>

          <Card style={{ backgroundColor: '#E8E0D2', borderColor: '#9B9182' }}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium" style={{ color: '#404750' }}>Low Stock</p>
                  <p className="text-2xl font-bold" style={{ color: '#2C313A' }}>{lowStockCount}</p>
                </div>
                <TrendingDown className="h-8 w-8" style={{ color: '#f59e0b' }} />
              </div>
            </CardContent>
          </Card>

          <Card style={{ backgroundColor: '#E8E0D2', borderColor: '#9B9182' }}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium" style={{ color: '#404750' }}>Out of Stock</p>
                  <p className="text-2xl font-bold" style={{ color: '#2C313A' }}>{outOfStockCount}</p>
                </div>
                <AlertTriangle className="h-8 w-8" style={{ color: '#ef4444' }} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for Products and Combos */}
        <Tabs defaultValue="products" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2" style={{ backgroundColor: '#E8E0D2', borderColor: '#9B9182' }}>
            <TabsTrigger value="products" style={{ color: '#2C313A' }}>Products</TabsTrigger>
            <TabsTrigger value="combos" style={{ color: '#2C313A' }}>Combo Items</TabsTrigger>
          </TabsList>

          <TabsContent value="products" className="space-y-6">
            {/* Filters and Actions */}
            <Card className="mb-6" style={{ backgroundColor: '#E8E0D2', borderColor: '#9B9182' }}>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="flex flex-col md:flex-row gap-4 flex-1">
                <div className="flex-1">
                  <Label htmlFor="search" style={{ color: '#2C313A' }}>Search Products</Label>
                  <Input
                    id="search"
                    placeholder="Search by name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ backgroundColor: 'white' }}
                  />
                </div>
                <div>
                  <Label style={{ color: '#2C313A' }}>Category</Label>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger style={{ backgroundColor: 'white', minWidth: '120px' }}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="drink">Drink</SelectItem>
                      <SelectItem value="food">Food</SelectItem>
                      <SelectItem value="accessory">Accessory</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label style={{ color: '#2C313A' }}>Stock Status</Label>
                  <Select value={stockFilter} onValueChange={setStockFilter}>
                    <SelectTrigger style={{ backgroundColor: 'white', minWidth: '120px' }}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Stock</SelectItem>
                      <SelectItem value="in_stock">In Stock</SelectItem>
                      <SelectItem value="low_stock">Low Stock</SelectItem>
                      <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    onClick={() => {
                      setEditingProduct(null);
                      setProductForm({ name: '', price: 0, cost: 0, quantity: 0, category: 'drink' });
                    }}
                    className="text-white"
                    style={{ backgroundColor: '#404750' }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Product
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md" style={{ backgroundColor: '#E8E0D2', borderColor: '#9B9182' }}>
                  <DialogHeader>
                    <DialogTitle style={{ color: '#2C313A' }}>
                      {editingProduct ? 'Edit Product' : 'Add New Product'}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="productName" style={{ color: '#2C313A' }}>Product Name</Label>
                      <Input
                        id="productName"
                        value={productForm.name}
                        onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                        placeholder="Enter product name"
                        style={{ backgroundColor: 'white' }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="productPrice" style={{ color: '#2C313A' }}>Price (₱)</Label>
                      <Input
                        id="productPrice"
                        type="number"
                        value={productForm.price}
                        onChange={(e) => setProductForm({ ...productForm, price: Number(e.target.value) })}
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        style={{ backgroundColor: 'white' }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="productCost" style={{ color: '#2C313A' }}>Cost (₱)</Label>
                      <Input
                        id="productCost"
                        type="number"
                        value={productForm.cost}
                        onChange={(e) => setProductForm({ ...productForm, cost: Number(e.target.value) })}
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        style={{ backgroundColor: 'white' }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="productQuantity" style={{ color: '#2C313A' }}>Quantity</Label>
                      <Input
                        id="productQuantity"
                        type="number"
                        value={productForm.quantity}
                        onChange={(e) => setProductForm({ ...productForm, quantity: Number(e.target.value) })}
                        min="0"
                        placeholder="0"
                        style={{ backgroundColor: 'white' }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="productCategory" style={{ color: '#2C313A' }}>Category</Label>
                      <Select
                        value={productForm.category}
                        onValueChange={(value: 'drink' | 'food' | 'accessory' | 'other') => setProductForm({ ...productForm, category: value })}
                      >
                        <SelectTrigger style={{ backgroundColor: 'white' }}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="drink">Drink</SelectItem>
                          <SelectItem value="food">Food</SelectItem>
                          <SelectItem value="accessory">Accessory</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex gap-2 pt-4">
                      <Button
                        onClick={handleProductSubmit}
                        className="flex-1 text-white"
                        style={{ backgroundColor: '#404750' }}
                      >
                        {editingProduct ? 'Update' : 'Add'} Product
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setIsProductDialogOpen(false)}
                        className="flex-1"
                        style={{ borderColor: '#9B9182', color: '#2C313A' }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>

        {/* Inventory Table */}
        <Card style={{ backgroundColor: '#E8E0D2', borderColor: '#9B9182' }}>
          <CardHeader style={{ backgroundColor: '#404750' }}>
            <CardTitle className="text-lg text-white font-semibold">
              Inventory Items ({filteredProducts.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b" style={{ borderColor: '#9B9182' }}>
                    <th className="text-left p-4 font-medium" style={{ color: '#2C313A' }}>Product</th>
                    <th className="text-left p-4 font-medium" style={{ color: '#2C313A' }}>Category</th>
                    <th className="text-left p-4 font-medium" style={{ color: '#2C313A' }}>Price</th>
                    <th className="text-left p-4 font-medium" style={{ color: '#2C313A' }}>Cost</th>
                    <th className="text-left p-4 font-medium" style={{ color: '#2C313A' }}>Stock</th>
                    <th className="text-left p-4 font-medium" style={{ color: '#2C313A' }}>Value</th>
                    <th className="text-left p-4 font-medium" style={{ color: '#2C313A' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product) => {
                    const stockStatus = getStockStatus(Number(product.quantity));
                    const StockIcon = stockStatus.icon;
                    const productValue = Number(product.cost) * Number(product.quantity);
                    
                    return (
                      <tr key={product.id} className="border-b" style={{ borderColor: '#9B9182' }}>
                        <td className="p-4">
                          <div>
                            <div className="font-medium" style={{ color: '#2C313A' }}>{product.name}</div>
                            <Badge variant={stockStatus.color as any} className="mt-1">
                              <StockIcon className="h-3 w-3 mr-1" />
                              {stockStatus.status.replace('_', ' ')}
                            </Badge>
                          </div>
                        </td>
                        <td className="p-4" style={{ color: '#404750' }}>
                          {product.category.charAt(0).toUpperCase() + product.category.slice(1)}
                        </td>
                        <td className="p-4" style={{ color: '#404750' }}>
                          ₱{formatCurrency(product.price)}
                        </td>
                        <td className="p-4" style={{ color: '#404750' }}>
                          ₱{formatCurrency(product.cost)}
                        </td>
                        <td className="p-4">
                          <span style={{ color: '#404750' }}>{Number(product.quantity)}</span>
                        </td>
                        <td className="p-4" style={{ color: '#404750' }}>
                          ₱{formatCurrency(productValue)}
                        </td>
                        <td className="p-4">
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditProduct(product)}
                              style={{ borderColor: '#9B9182', color: '#2C313A' }}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteProduct(product.id)}
                              style={{ borderColor: '#9B9182', color: '#2C313A' }}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {filteredProducts.length === 0 && (
                <div className="text-center py-8" style={{ color: '#404750' }}>
                  No products found matching your criteria.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
          </TabsContent>

          <TabsContent value="combos" className="space-y-6">
            <ComboManagement />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
