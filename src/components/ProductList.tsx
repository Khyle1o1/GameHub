import { Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Product } from '@/types/pos';
import { usePosStore } from '@/hooks/usePosStore';

interface ProductListProps {
  products: Product[];
  disabled: boolean;
}

export function ProductList({ products, disabled }: ProductListProps) {
  const { selectedTableId, addOrderItem } = usePosStore();
  
  const drinks = products.filter(p => p.category === 'drink');
  const foods = products.filter(p => p.category === 'food');
  const accessories = products.filter(p => p.category === 'accessory');
  const others = products.filter(p => p.category === 'other');

  const handleAddProduct = async (product: Product) => {
    if (!selectedTableId) return;
    
    try {
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
                  <div className="text-sm" style={{ color: '#404750' }}>₱{Number(product.price).toFixed(2)}</div>
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
                  <div className="text-sm" style={{ color: '#404750' }}>₱{Number(product.price).toFixed(2)}</div>
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
                    <div className="text-sm" style={{ color: '#404750' }}>₱{Number(product.price).toFixed(2)}</div>
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
                    <div className="text-sm" style={{ color: '#404750' }}>₱{Number(product.price).toFixed(2)}</div>
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
    </div>
  );
}
