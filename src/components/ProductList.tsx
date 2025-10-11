import { Plus, Package } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Product, ComboItem } from '@/types/pos';
import { usePosStore } from '@/hooks/usePosStore';
import { formatCurrency } from '@/lib/utils';

interface ProductListProps {
  products: Product[];
  comboItems: ComboItem[];
  disabled: boolean;
}

export function ProductList({ products, comboItems, disabled }: ProductListProps) {
  const { selectedTableId, addOrderItem } = usePosStore();
  
  const drinks = products.filter(p => p.category === 'drink');
  const foods = products.filter(p => p.category === 'food');
  const accessories = products.filter(p => p.category === 'accessory');
  const others = products.filter(p => p.category === 'other');

  const handleAddProduct = async (product: Product) => {
    try {
      // Allow adding products even without a table selected (for standalone orders)
      await addOrderItem(selectedTableId, {
        productId: product.id,
        productName: product.name,
        price: product.price,
        quantity: 1,
      });
    } catch (error) {
      console.error('Error adding product to order:', error);
    }
  };

  const handleAddCombo = async (combo: ComboItem) => {
    try {
      // For combo items, we use a special approach:
      // - productId is set to 0 (which doesn't exist in products table, but we handle this in the backend)
      // - comboId is set to the actual combo ID
      // - The backend will set product_id to NULL for combo orders
      await addOrderItem(selectedTableId, {
        productId: 0, // This will be set to NULL in the backend for combo orders
        productName: combo.name,
        price: combo.price,
        quantity: 1,
        comboId: combo.id,
      });
    } catch (error) {
      console.error('Error adding combo to order:', error);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-sm" style={{ backgroundColor: '#E8E0D2', borderColor: '#9B9182' }}>
        <CardHeader style={{ backgroundColor: '#404750' }}>
          <CardTitle className="text-lg text-white font-semibold flex items-center gap-2">
            <span className="text-xl">🥤</span>
            Drinks
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="grid gap-3">
            {drinks.map(product => (
              <div
                key={product.id}
                className="flex items-center justify-between p-3 rounded-lg border transition-all duration-200 hover:shadow-sm"
                style={{ 
                  borderColor: '#9B9182',
                  backgroundColor: '#E8E0D2'
                }}
              >
                <div className="flex-1">
                  <div className="font-medium" style={{ color: '#2C313A' }}>{product.name}</div>
                  <div className="text-sm" style={{ color: '#404750' }}>₱{formatCurrency(product.price)}</div>
                </div>
                <Button
                  size="sm"
                  onClick={() => handleAddProduct(product)}
                  disabled={disabled}
                  className="text-white"
                  style={{ 
                    backgroundColor: disabled ? '#9B9182' : '#404750',
                    color: '#E8E0D2'
                  }}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm" style={{ backgroundColor: '#E8E0D2', borderColor: '#9B9182' }}>
        <CardHeader style={{ backgroundColor: '#2C313A' }}>
          <CardTitle className="text-lg text-white font-semibold flex items-center gap-2">
            <span className="text-xl">🍕</span>
            Food
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="grid gap-3">
            {foods.map(product => (
              <div
                key={product.id}
                className="flex items-center justify-between p-3 rounded-lg border transition-all duration-200 hover:shadow-sm"
                style={{ 
                  borderColor: '#9B9182',
                  backgroundColor: '#E8E0D2'
                }}
              >
                <div className="flex-1">
                  <div className="font-medium" style={{ color: '#2C313A' }}>{product.name}</div>
                  <div className="text-sm" style={{ color: '#404750' }}>₱{formatCurrency(product.price)}</div>
                </div>
                <Button
                  size="sm"
                  onClick={() => handleAddProduct(product)}
                  disabled={disabled}
                  className="text-white"
                  style={{ 
                    backgroundColor: disabled ? '#9B9182' : '#2C313A',
                    color: '#E8E0D2'
                  }}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {accessories.length > 0 && (
        <Card className="shadow-sm" style={{ backgroundColor: '#E8E0D2', borderColor: '#9B9182' }}>
          <CardHeader style={{ backgroundColor: '#2C313A' }}>
            <CardTitle className="text-lg text-white font-semibold flex items-center gap-2">
              <span className="text-xl">🎯</span>
              Accessories
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="grid gap-3">
              {accessories.map(product => (
                <div
                  key={product.id}
                  className="flex items-center justify-between p-3 rounded-lg border transition-all duration-200 hover:shadow-sm"
                  style={{ 
                    borderColor: '#9B9182',
                    backgroundColor: '#E8E0D2'
                  }}
                >
                  <div className="flex-1">
                    <div className="font-medium" style={{ color: '#2C313A' }}>{product.name}</div>
                    <div className="text-sm" style={{ color: '#404750' }}>₱{formatCurrency(product.price)}</div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleAddProduct(product)}
                    disabled={disabled}
                    className="text-white"
                    style={{ 
                      backgroundColor: disabled ? '#9B9182' : '#2C313A',
                      color: '#E8E0D2'
                    }}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {others.length > 0 && (
        <Card className="shadow-sm" style={{ backgroundColor: '#E8E0D2', borderColor: '#9B9182' }}>
          <CardHeader style={{ backgroundColor: '#2C313A' }}>
            <CardTitle className="text-lg text-white font-semibold flex items-center gap-2">
              <span className="text-xl">📦</span>
              Other
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="grid gap-3">
              {others.map(product => (
                <div
                  key={product.id}
                  className="flex items-center justify-between p-3 rounded-lg border transition-all duration-200 hover:shadow-sm"
                  style={{ 
                    borderColor: '#9B9182',
                    backgroundColor: '#E8E0D2'
                  }}
                >
                  <div className="flex-1">
                    <div className="font-medium" style={{ color: '#2C313A' }}>{product.name}</div>
                    <div className="text-sm" style={{ color: '#404750' }}>₱{formatCurrency(product.price)}</div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleAddProduct(product)}
                    disabled={disabled}
                    className="text-white"
                    style={{ 
                      backgroundColor: disabled ? '#9B9182' : '#2C313A',
                      color: '#E8E0D2'
                    }}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Combo Items Section */}
      {comboItems.length > 0 && (
        <Card className="shadow-sm" style={{ backgroundColor: '#E8E0D2', borderColor: '#9B9182' }}>
          <CardHeader style={{ backgroundColor: '#404750' }}>
            <CardTitle className="text-lg text-white font-semibold flex items-center gap-2">
              <Package className="h-5 w-5" />
              Combo Items
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="grid gap-3">
              {comboItems.map(combo => (
                <div
                  key={combo.id}
                  className="flex items-center justify-between p-3 rounded-lg border transition-all duration-200 hover:shadow-sm"
                  style={{ 
                    backgroundColor: 'white', 
                    borderColor: '#9B9182',
                    opacity: disabled ? 0.6 : 1
                  }}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium" style={{ color: '#2C313A' }}>
                        {combo.name}
                      </h3>
                      <span className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: '#E8E0D2', color: '#404750' }}>
                        COMBO
                      </span>
                    </div>
                    {combo.description && (
                      <p className="text-sm text-gray-600 mt-1">{combo.description}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2">
                      <span className="text-sm font-medium" style={{ color: '#2C313A' }}>
                        ₱{formatCurrency(typeof combo.price === 'string' ? parseFloat(combo.price) : combo.price)}
                      </span>
                      <div className="text-xs text-gray-500">
                        {combo.components.length} item{combo.components.length !== 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleAddCombo(combo)}
                    disabled={disabled}
                    className="text-white"
                    style={{ 
                      backgroundColor: disabled ? '#9B9182' : '#2C313A',
                      color: '#E8E0D2'
                    }}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
