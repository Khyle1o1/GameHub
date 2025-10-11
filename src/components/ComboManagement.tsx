import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Package, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { usePosStore } from '@/hooks/usePosStore';
import { ComboItem, Product } from '@/types/pos';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/utils';

export default function ComboManagement() {
  const { toast } = useToast();
  const { 
    products, 
    comboItems, 
    fetchProducts, 
    fetchComboItems, 
    createComboItem, 
    updateComboItem, 
    deleteComboItem,
    checkComboStock 
  } = usePosStore();
  
  const [isComboDialogOpen, setIsComboDialogOpen] = useState(false);
  const [editingCombo, setEditingCombo] = useState<ComboItem | null>(null);
  const [comboForm, setComboForm] = useState({
    name: '',
    description: '',
    price: 0,
    category: 'combo' as 'drink' | 'food' | 'accessory' | 'other' | 'combo',
    components: [] as Array<{ product_id: number; quantity: number }>
  });

  useEffect(() => {
    fetchProducts();
    fetchComboItems();
  }, [fetchProducts, fetchComboItems]);

  const handleComboSubmit = async () => {
    if (!comboForm.name || comboForm.price <= 0 || comboForm.components.length === 0) {
      toast({
        title: "Error",
        description: "Please fill in all required fields and add at least one component.",
        variant: "destructive",
        duration: 4000,
      });
      return;
    }

    try {
      if (editingCombo) {
        await updateComboItem(editingCombo.id, comboForm);
        toast({
          title: "Success",
          description: "Combo item updated successfully.",
          duration: 3000,
        });
      } else {
        await createComboItem(comboForm);
        toast({
          title: "Success",
          description: "Combo item created successfully.",
          duration: 3000,
        });
      }
      
      setIsComboDialogOpen(false);
      resetComboForm();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save combo item.",
        variant: "destructive",
        duration: 4000,
      });
    }
  };

  const resetComboForm = () => {
    setComboForm({
      name: '',
      description: '',
      price: 0,
      category: 'combo',
      components: []
    });
    setEditingCombo(null);
  };

  const handleEditCombo = (combo: ComboItem) => {
    setEditingCombo(combo);
    setComboForm({
      name: combo.name,
      description: combo.description || '',
      price: typeof combo.price === 'string' ? parseFloat(combo.price) : combo.price,
      category: combo.category,
      components: combo.components.map(c => ({
        product_id: c.product_id,
        quantity: c.quantity
      }))
    });
    setIsComboDialogOpen(true);
  };

  const handleDeleteCombo = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this combo item?')) {
      try {
        await deleteComboItem(id);
        toast({
          title: "Success",
          description: "Combo item deleted successfully.",
          duration: 3000,
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete combo item.",
          variant: "destructive",
          duration: 4000,
        });
      }
    }
  };

  const addComponent = () => {
    setComboForm(prev => ({
      ...prev,
      components: [...prev.components, { product_id: 0, quantity: 1 }]
    }));
  };

  const removeComponent = (index: number) => {
    setComboForm(prev => ({
      ...prev,
      components: prev.components.filter((_, i) => i !== index)
    }));
  };

  const updateComponent = (index: number, field: 'product_id' | 'quantity', value: number) => {
    setComboForm(prev => ({
      ...prev,
      components: prev.components.map((comp, i) => 
        i === index ? { ...comp, [field]: value } : comp
      )
    }));
  };

  const getProductName = (productId: number) => {
    const product = products.find(p => p.id === productId);
    return product ? product.name : 'Unknown Product';
  };

  const checkStockForCombo = async (comboId: number) => {
    try {
      const stockCheck = await checkComboStock(comboId, 1);
      if (stockCheck.can_sell) {
        toast({
          title: "Stock Check",
          description: "All components are in stock.",
          duration: 3000,
        });
      } else {
        const outOfStockItems = stockCheck.out_of_stock_items.map((item: any) => 
          `${item.product_name} (need ${item.required_quantity}, have ${item.available_quantity})`
        ).join(', ');
        
        toast({
          title: "Stock Check",
          description: `Out of stock: ${outOfStockItems}`,
          variant: "destructive",
          duration: 5000,
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to check stock.",
        variant: "destructive",
        duration: 4000,
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Combo Management</h2>
        <Dialog open={isComboDialogOpen} onOpenChange={setIsComboDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetComboForm}>
              <Plus className="w-4 h-4 mr-2" />
              Add Combo
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingCombo ? 'Edit Combo Item' : 'Add New Combo Item'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="combo-name">Name *</Label>
                  <Input
                    id="combo-name"
                    value={comboForm.name}
                    onChange={(e) => setComboForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Select Set"
                  />
                </div>
                <div>
                  <Label htmlFor="combo-price">Price *</Label>
                  <Input
                    id="combo-price"
                    type="number"
                    step="0.01"
                    value={comboForm.price}
                    onChange={(e) => setComboForm(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                    placeholder="0.00"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="combo-description">Description</Label>
                <Input
                  id="combo-description"
                  value={comboForm.description}
                  onChange={(e) => setComboForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Optional description"
                />
              </div>

              <div>
                <Label>Components *</Label>
                <div className="space-y-2">
                  {comboForm.components.map((component, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      <Select
                        value={component.product_id.toString()}
                        onValueChange={(value) => updateComponent(index, 'product_id', parseInt(value))}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Select product" />
                        </SelectTrigger>
                        <SelectContent>
                          {products.map((product) => (
                            <SelectItem key={product.id} value={product.id.toString()}>
                              {product.name} (Stock: {product.quantity})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        type="number"
                        min="1"
                        value={component.quantity}
                        onChange={(e) => updateComponent(index, 'quantity', parseInt(e.target.value) || 1)}
                        className="w-20"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeComponent(index)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  <Button variant="outline" onClick={addComponent} className="w-full">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Component
                  </Button>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsComboDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleComboSubmit}>
                  {editingCombo ? 'Update' : 'Create'} Combo
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {comboItems.map((combo) => (
          <Card key={combo.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    {combo.name}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {combo.description}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => checkStockForCombo(combo.id)}
                  >
                    <AlertTriangle className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditCombo(combo)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteCombo(combo.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Price:</span>
                  <span className="text-lg font-bold text-green-600">
                    {formatCurrency(typeof combo.price === 'string' ? parseFloat(combo.price) : combo.price)}
                  </span>
                </div>
                
                <div>
                  <span className="font-medium">Components:</span>
                  <div className="mt-2 space-y-1">
                    {combo.components.map((component, index) => (
                      <div key={index} className="flex justify-between items-center text-sm">
                        <span>{getProductName(component.product_id)}</span>
                        <Badge variant="secondary">x{component.quantity}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {comboItems.length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No combo items found.</p>
              <p className="text-sm text-muted-foreground">Create your first combo item to get started.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
