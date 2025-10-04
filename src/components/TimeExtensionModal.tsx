import { useState } from 'react';
import { Clock, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface TimeExtensionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTime: (duration: number) => void;
  currentTimeRemaining: number;
}

const EXTENSION_OPTIONS = [
  { label: '+30 minutes', value: 30 * 60 },
  { label: '+1 hour', value: 60 * 60 },
  { label: '+1 hour 30 minutes', value: 90 * 60 },
  { label: '+2 hours', value: 120 * 60 },
  { label: '+2 hours 30 minutes', value: 150 * 60 },
  { label: '+3 hours', value: 180 * 60 },
];

export function TimeExtensionModal({ 
  isOpen, 
  onClose, 
  onAddTime,
  currentTimeRemaining
}: TimeExtensionModalProps) {
  const [selectedExtension, setSelectedExtension] = useState<number>(30 * 60); // Default to +30 minutes

  const handleAddTime = () => {
    onAddTime(selectedExtension);
    onClose();
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4" style={{ backgroundColor: '#E8E0D2', borderColor: '#9B9182' }}>
        <CardHeader style={{ backgroundColor: '#2C313A' }}>
          <CardTitle className="text-lg text-white font-semibold flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add Time
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="p-3 rounded-lg border" style={{ backgroundColor: '#9B9182', borderColor: '#404750' }}>
            <div className="text-sm" style={{ color: '#E8E0D2' }}>
              <span className="font-medium">Current time remaining:</span>
            </div>
            <div className="text-lg font-mono font-bold" style={{ color: '#E8E0D2' }}>
              {formatTime(currentTimeRemaining)}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" style={{ color: '#2C313A' }}>
              Add time:
            </label>
            <Select value={selectedExtension.toString()} onValueChange={(value) => setSelectedExtension(Number(value))}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select time to add" />
              </SelectTrigger>
              <SelectContent>
                {EXTENSION_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value.toString()}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="p-3 rounded-lg border" style={{ backgroundColor: '#E8E0D2', borderColor: '#9B9182' }}>
            <div className="text-sm" style={{ color: '#404750' }}>
              <span className="font-medium">New total time:</span>
            </div>
            <div className="text-lg font-mono font-bold" style={{ color: '#2C313A' }}>
              {formatTime(currentTimeRemaining + selectedExtension)}
            </div>
          </div>
          
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
              style={{ 
                borderColor: '#9B9182', 
                color: '#2C313A',
                backgroundColor: 'transparent'
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddTime}
              className="flex-1 text-white"
              style={{ backgroundColor: '#404750' }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Time
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
