import { useState } from 'react';
import { CreditCard, Smartphone, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Table } from '@/types/pos';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  table: Table | null;
  totalAmount: number;
  onConfirmPayment: (paymentMethod: 'cash' | 'gcash', referenceNumber?: string) => void;
}

export function PaymentModal({ isOpen, onClose, table, totalAmount, onConfirmPayment }: PaymentModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'gcash'>('cash');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleConfirm = async () => {
    setIsProcessing(true);
    try {
      await onConfirmPayment(
        paymentMethod, 
        paymentMethod === 'gcash' ? referenceNumber : undefined
      );
      onClose();
      setReferenceNumber('');
      setPaymentMethod('cash');
    } catch (error) {
      console.error('Payment failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    if (!isProcessing) {
      onClose();
      setReferenceNumber('');
      setPaymentMethod('cash');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md" style={{ backgroundColor: '#E8E0D2', borderColor: '#9B9182' }}>
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between" style={{ color: '#2C313A' }}>
            <span>Payment - {table?.name}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Total Amount */}
          <div className="p-4 rounded-lg border text-center" style={{ backgroundColor: '#E8E0D2', borderColor: '#9B9182' }}>
            <div className="text-sm" style={{ color: '#404750' }}>Total Amount</div>
            <div className="text-3xl font-bold" style={{ color: '#2C313A' }}>₱{totalAmount.toFixed(2)}</div>
          </div>

          {/* Payment Method Selection */}
          <div className="space-y-4">
            <Label className="text-sm font-medium" style={{ color: '#2C313A' }}>
              Select Payment Method
            </Label>
            <RadioGroup
              value={paymentMethod}
              onValueChange={(value: 'cash' | 'gcash') => setPaymentMethod(value)}
              className="space-y-3"
            >
              <div className="flex items-center space-x-3 p-3 rounded-lg border" style={{ borderColor: '#9B9182' }}>
                <RadioGroupItem value="cash" id="cash" />
                <Label htmlFor="cash" className="flex items-center gap-2 cursor-pointer flex-1">
                  <CreditCard className="h-4 w-4" style={{ color: '#404750' }} />
                  <span style={{ color: '#2C313A' }}>Cash</span>
                </Label>
              </div>
              <div className="flex items-center space-x-3 p-3 rounded-lg border" style={{ borderColor: '#9B9182' }}>
                <RadioGroupItem value="gcash" id="gcash" />
                <Label htmlFor="gcash" className="flex items-center gap-2 cursor-pointer flex-1">
                  <Smartphone className="h-4 w-4" style={{ color: '#404750' }} />
                  <span style={{ color: '#2C313A' }}>GCash</span>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* GCash Reference Number */}
          {paymentMethod === 'gcash' && (
            <div className="space-y-2">
              <Label htmlFor="referenceNumber" style={{ color: '#2C313A' }}>
                GCash Reference Number (Optional)
              </Label>
              <Input
                id="referenceNumber"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                placeholder="Enter reference number"
                style={{ backgroundColor: 'white' }}
              />
              <p className="text-xs" style={{ color: '#404750' }}>
                You can also upload a QR receipt later
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleConfirm}
              disabled={isProcessing}
              className="flex-1 text-white"
              style={{ 
                backgroundColor: isProcessing ? '#9B9182' : '#404750',
                color: '#E8E0D2'
              }}
            >
              {isProcessing ? 'Processing...' : 'Confirm Payment'}
            </Button>
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isProcessing}
              className="flex-1"
              style={{ 
                borderColor: '#9B9182', 
                color: '#2C313A',
                backgroundColor: 'transparent'
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
