import { Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Product } from '@/types/pos';

interface ProductListProps {
  products: Product[];
  onAddProduct: (productId: string) => void;
  disabled: boolean;
}

export function ProductList({ products, onAddProduct, disabled }: ProductListProps) {
  const drinks = products.filter(p => p.category === 'drink');
  const foods = products.filter(p => p.category === 'food');

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Drinks</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2">
          {drinks.map(product => (
            <div
              key={product.id}
              className="flex items-center justify-between p-2 rounded-lg border hover:bg-secondary/50 transition-colors"
            >
              <div>
                <div className="font-medium">{product.name}</div>
                <div className="text-sm text-muted-foreground">₱{product.price}</div>
              </div>
              <Button
                size="sm"
                onClick={() => onAddProduct(product.id)}
                disabled={disabled}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Food</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2">
          {foods.map(product => (
            <div
              key={product.id}
              className="flex items-center justify-between p-2 rounded-lg border hover:bg-secondary/50 transition-colors"
            >
              <div>
                <div className="font-medium">{product.name}</div>
                <div className="text-sm text-muted-foreground">₱{product.price}</div>
              </div>
              <Button
                size="sm"
                onClick={() => onAddProduct(product.id)}
                disabled={disabled}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
