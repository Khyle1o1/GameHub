import { useState, useEffect } from 'react';
import { Clock, Play, Square, RotateCcw, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table } from '@/types/pos';
import { usePosStore } from '@/hooks/usePosStore';
import { DurationSelector } from '@/components/DurationSelector';
import { TimeExtensionModal } from '@/components/TimeExtensionModal';

interface TableCardProps {
  table: Table;
}

export function TableCard({ table }: TableCardProps) {
  const { selectedTableId, startTableSession, stopTableSession, resetTable, setSelectedTable, calculateTableTotal, calculateOpenTimeCost, addTimeExtension } = usePosStore();
  const [elapsedTime, setElapsedTime] = useState(0);
  const [pricingBreakdown, setPricingBreakdown] = useState('');
  const [isDurationSelectorOpen, setIsDurationSelectorOpen] = useState(false);
  const [isTimeExtensionOpen, setIsTimeExtensionOpen] = useState(false);

  useEffect(() => {
    if (!table.startTime) {
      setElapsedTime(0);
      setPricingBreakdown('');
      return;
    }

    // If session is stopped (endTime is set), freeze the timer at the stopped time
    if (table.endTime) {
      const finalElapsed = Math.floor((table.endTime - table.startTime) / 1000);
      setElapsedTime(finalElapsed);
      
      if (table.mode === 'open') {
        const { breakdown } = calculateOpenTimeCost(finalElapsed);
        setPricingBreakdown(breakdown);
      }
      return; // Don't run interval for stopped sessions
    }

    // For active sessions, calculate and update timer in real-time
    if (table.isActive) {
      const now = Date.now();
      const initialElapsed = Math.floor((now - table.startTime) / 1000);
      
      setElapsedTime(initialElapsed);

      if (table.mode === 'open') {
        const { breakdown } = calculateOpenTimeCost(initialElapsed);
        setPricingBreakdown(breakdown);
      }

      const interval = setInterval(() => {
        const now = Date.now();
        const elapsed = Math.floor((now - table.startTime) / 1000);
        
        setElapsedTime(elapsed);

        if (table.mode === 'open') {
          const { breakdown } = calculateOpenTimeCost(elapsed);
          setPricingBreakdown(breakdown);
        }

        // Auto-stop after 1 hour if in hour mode
        if (table.mode === 'hour' && elapsed >= 3600) {
          stopTableSession(table.id);
        }

        // Auto-stop when countdown reaches 0
        if (table.mode === 'countdown' && table.countdownDuration) {
          const totalExtensions = (table.timeExtensions || []).reduce((sum, ext) => sum + ext.addedDuration, 0);
          const totalDuration = table.countdownDuration + totalExtensions;
          if (elapsed >= totalDuration) {
            stopTableSession(table.id);
          }
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [table.isActive, table.startTime, table.endTime, table.mode, table.id, table.countdownDuration, table.timeExtensions, stopTableSession, calculateOpenTimeCost]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getRemainingTime = () => {
    if (table.mode === 'countdown' && table.countdownDuration) {
      const totalExtensions = (table.timeExtensions || []).reduce((sum, ext) => sum + ext.addedDuration, 0);
      const totalDuration = table.countdownDuration + totalExtensions;
      const remaining = Math.max(0, totalDuration - elapsedTime);
      return remaining;
    }
    return elapsedTime;
  };

  const getDisplayTime = () => {
    if (table.mode === 'countdown') {
      return getRemainingTime();
    }
    return elapsedTime;
  };

  const getStatusColor = () => {
    if (table.isActive) {
      if (table.mode === 'countdown') {
        const remaining = getRemainingTime();
        if (remaining <= 300) { // 5 minutes or less
          return '#DC2626'; // Red for urgent
        } else if (remaining <= 900) { // 15 minutes or less
          return '#F59E0B'; // Orange for warning
        }
        return '#059669'; // Green for good
      }
      return table.mode === 'hour' ? '#9B9182' : '#414A52';
    }
    if (table.status === 'needs_checkout') {
      return '#DC2626'; // Red for needs checkout
    }
    return '#2C3035';
  };

  const getStatusText = () => {
    if (table.status === 'stopped') {
      return 'Stopped';
    }
    if (table.status === 'needs_checkout') {
      return 'Time\'s Up';
    }
    if (table.isActive) {
      if (table.mode === 'countdown') {
        const remaining = getRemainingTime();
        const hours = Math.floor(remaining / 3600);
        const minutes = Math.floor((remaining % 3600) / 60);
        if (hours > 0) {
          return `${hours}h ${minutes}m`;
        }
        return `${minutes}m`;
      }
      return table.mode === 'hour' ? '1 Hour' : 'Open Time';
    }
    return 'Available';
  };

  const { timeCost, productCost, total } = calculateTableTotal(table.id);
  const orderCount = table.orders?.reduce((sum, order) => sum + order.quantity, 0) || 0;

  return (
    <Card
      className={`cursor-pointer transition-all duration-300 hover:shadow-xl border-2 ${
        selectedTableId === table.id 
          ? 'shadow-xl ring-2' 
          : 'hover:shadow-lg'
      }`}
      style={{ 
        backgroundColor: '#E8E0D2',
        borderColor: selectedTableId === table.id ? '#9B9182' : '#404750',
        ringColor: selectedTableId === table.id ? '#9B9182' : 'transparent'
      }}
      onClick={() => setSelectedTable(table.id)}
    >
      <CardHeader className="pb-3" style={{ backgroundColor: '#2C313A' }}>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg text-white font-semibold">{table.name}</CardTitle>
          <Badge 
            className="text-white border-0 font-medium"
            style={{ 
              backgroundColor: table.isActive 
                ? table.mode === 'hour' 
                  ? '#9B9182' 
                  : '#404750'
                : '#373D45'
            }}
          >
            {getStatusText()}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4 p-4">
        {(table.isActive || table.status === 'stopped') && table.startTime && (
          <div className="space-y-3 p-3 rounded-lg border" style={{ backgroundColor: '#E8E0D2', borderColor: '#9B9182' }}>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" style={{ color: '#404750' }} />
              <span className="font-mono text-xl font-bold" style={{ color: '#2C313A' }}>
                {formatTime(getDisplayTime())}
              </span>
            </div>
            
            {/* Pricing Breakdown for Open Time */}
            {table.mode === 'open' && pricingBreakdown && (
              <div className="text-xs p-2 rounded" style={{ backgroundColor: '#9B9182', color: '#E8E0D2' }}>
                <span className="font-medium">Breakdown:</span> {pricingBreakdown}
              </div>
            )}
            
            <div className="grid grid-cols-1 gap-2 text-sm">
              <div className="flex justify-between">
                <span style={{ color: '#404750' }}>Time Cost:</span>
                <span className="font-medium" style={{ color: '#2C313A' }}>₱{timeCost.toFixed(2)}</span>
              </div>
              {productCost > 0 && (
                <div className="flex justify-between">
                  <span style={{ color: '#404750' }}>Products:</span>
                  <span className="font-medium" style={{ color: '#2C313A' }}>₱{productCost.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between pt-2" style={{ borderTop: '1px solid #9B9182' }}>
                <span className="font-semibold" style={{ color: '#2C313A' }}>Total:</span>
                <span className="font-bold text-lg" style={{ color: '#2C313A' }}>₱{total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-1 flex-wrap">
          {!table.isActive && table.status !== 'stopped' && table.status !== 'needs_checkout' ? (
            <>
              <Button
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  startTableSession(table.id, 'open');
                }}
                className="flex-1 min-w-0 text-white"
                style={{ backgroundColor: '#404750' }}
              >
                <Play className="h-4 w-4 mr-1" />
                Start Open
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsDurationSelectorOpen(true);
                }}
                className="flex-1 min-w-0"
                style={{ 
                  borderColor: '#9B9182', 
                  color: '#2C313A',
                  backgroundColor: 'transparent'
                }}
              >
                <Play className="h-4 w-4 mr-1" />
                Timer
              </Button>
            </>
          ) : table.status === 'stopped' || table.status === 'needs_checkout' ? (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  resetTable(table.id);
                }}
                className="w-full"
                style={{ 
                  borderColor: '#9B9182', 
                  color: '#2C313A',
                  backgroundColor: 'transparent'
                }}
              >
                <RotateCcw className="h-4 w-4 mr-1" />
                Reset
              </Button>
            </>
          ) : (
            <>
              {table.mode === 'countdown' && (
                <Button
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsTimeExtensionOpen(true);
                  }}
                  className="flex-1 min-w-0 text-white"
                  style={{ backgroundColor: '#059669' }}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              )}
              <Button
                size="sm"
                variant="destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  stopTableSession(table.id);
                }}
                className="flex-1 min-w-0 text-white"
                style={{ backgroundColor: '#2C313A' }}
              >
                <Square className="h-4 w-4 mr-1" />
                Stop
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  resetTable(table.id);
                }}
                className="flex-1 min-w-0"
                style={{ 
                  borderColor: '#9B9182', 
                  color: '#2C313A',
                  backgroundColor: 'transparent'
                }}
              >
                <RotateCcw className="h-4 w-4 mr-1" />
                Reset
              </Button>
            </>
          )}
        </div>

        {orderCount > 0 && (
          <div className="text-sm px-3 py-2 rounded-lg border" style={{ color: '#404750', backgroundColor: '#E8E0D2', borderColor: '#9B9182' }}>
            <span className="font-medium">Orders:</span> {orderCount} items
          </div>
        )}
      </CardContent>

      {/* Duration Selector Modal */}
      <DurationSelector
        isOpen={isDurationSelectorOpen}
        onClose={() => setIsDurationSelectorOpen(false)}
        onStart={(duration) => {
          startTableSession(table.id, 'countdown', duration);
        }}
        title="Start Countdown Timer"
        buttonText="Start Timer"
      />

      {/* Time Extension Modal */}
      <TimeExtensionModal
        isOpen={isTimeExtensionOpen}
        onClose={() => setIsTimeExtensionOpen(false)}
        onAddTime={(duration) => {
          addTimeExtension(table.id, duration);
        }}
        currentTimeRemaining={getRemainingTime()}
      />
    </Card>
  );
}