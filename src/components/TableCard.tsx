import { useState, useEffect } from 'react';
import { Clock, Play, Square } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table } from '@/types/pos';
import { calculateElapsedTime, formatTime } from '@/utils/timeCalculations';

interface TableCardProps {
  table: Table;
  onStart: (mode: 'open' | 'hour') => void;
  onStop: () => void;
  onSelect: () => void;
  isSelected: boolean;
}

export function TableCard({ table, onStart, onStop, onSelect, isSelected }: TableCardProps) {
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    if (!table.isActive || !table.startTime) return;

    const interval = setInterval(() => {
      const elapsed = calculateElapsedTime(table.startTime!);
      setElapsedTime(elapsed);

      // Auto-stop after 1 hour if in hour mode
      if (table.mode === 'hour' && elapsed >= 3600) {
        onStop();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [table.isActive, table.startTime, table.mode, onStop]);

  const orderCount = table.orders.reduce((sum, order) => sum + order.quantity, 0);

  return (
    <Card
      className={`cursor-pointer transition-all hover:shadow-lg ${
        isSelected ? 'ring-2 ring-primary' : ''
      } ${table.isActive ? 'border-success' : ''}`}
      onClick={onSelect}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{table.name}</CardTitle>
          <Badge variant={table.isActive ? 'default' : 'secondary'} className={table.isActive ? 'bg-success' : ''}>
            {table.isActive ? 'Active' : 'Idle'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {table.isActive && table.startTime ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-2xl font-bold text-primary">
              <Clock className="h-5 w-5" />
              {formatTime(elapsedTime)}
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="destructive"
                className="flex-1"
                onClick={(e) => {
                  e.stopPropagation();
                  onStop();
                }}
              >
                <Square className="h-4 w-4 mr-1" />
                Stop
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="default"
              className="flex-1"
              onClick={(e) => {
                e.stopPropagation();
                onStart('open');
              }}
            >
              <Play className="h-4 w-4 mr-1" />
              Open Time
            </Button>
            <Button
              size="sm"
              variant="secondary"
              className="flex-1"
              onClick={(e) => {
                e.stopPropagation();
                onStart('hour');
              }}
            >
              <Clock className="h-4 w-4 mr-1" />
              1 Hour
            </Button>
          </div>
        )}
        {orderCount > 0 && (
          <div className="text-sm text-muted-foreground">
            {orderCount} item{orderCount !== 1 ? 's' : ''} ordered
          </div>
        )}
      </CardContent>
    </Card>
  );
}
