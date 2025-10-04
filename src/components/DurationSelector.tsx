import { useState } from 'react';
import { Clock, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface DurationSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onStart: (duration: number) => void;
  title?: string;
  buttonText?: string;
}

const DURATION_OPTIONS = [
  { label: '30 minutes', value: 30 * 60 },
  { label: '1 hour', value: 60 * 60 },
  { label: '1 hour 30 minutes', value: 90 * 60 },
  { label: '2 hours', value: 120 * 60 },
  { label: '2 hours 30 minutes', value: 150 * 60 },
  { label: '3 hours', value: 180 * 60 },
  { label: '3 hours 30 minutes', value: 210 * 60 },
  { label: '4 hours', value: 240 * 60 },
  { label: '4 hours 30 minutes', value: 270 * 60 },
  { label: '5 hours', value: 300 * 60 },
];

export function DurationSelector({ 
  isOpen, 
  onClose, 
  onStart, 
  title = "Select Duration",
  buttonText = "Start Timer"
}: DurationSelectorProps) {
  const [selectedDuration, setSelectedDuration] = useState<number>(60 * 60); // Default to 1 hour

  const handleStart = () => {
    onStart(selectedDuration);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4" style={{ backgroundColor: '#E8E0D2', borderColor: '#9B9182' }}>
        <CardHeader style={{ backgroundColor: '#2C313A' }}>
          <CardTitle className="text-lg text-white font-semibold flex items-center gap-2">
            <Clock className="h-5 w-5" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium" style={{ color: '#2C313A' }}>
              Choose duration:
            </label>
            <Select value={selectedDuration.toString()} onValueChange={(value) => setSelectedDuration(Number(value))}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select duration" />
              </SelectTrigger>
              <SelectContent>
                {DURATION_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value.toString()}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
              onClick={handleStart}
              className="flex-1 text-white"
              style={{ backgroundColor: '#404750' }}
            >
              <Play className="h-4 w-4 mr-2" />
              {buttonText}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
