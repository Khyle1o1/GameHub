import { useState, useEffect } from 'react';
import { ArrowLeft, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { Table } from '@/types/pos';
import { usePosStore } from '@/hooks/usePosStore';

export default function DisplayScreen() {
  const navigate = useNavigate();
  const { tables, fetchTables } = usePosStore();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    fetchTables();
    
    // Update current time every second
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    // Refresh tables every 5 seconds
    const refreshInterval = setInterval(() => {
      fetchTables();
    }, 5000);

    return () => {
      clearInterval(timeInterval);
      clearInterval(refreshInterval);
    };
  }, [fetchTables]);

  const activeTables = tables.filter(t => t.isActive);

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#E8E0D2' }}>
      {/* Header */}
      <header className="border-b" style={{ backgroundColor: '#2C3035', borderColor: '#414A52' }}>
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-[#E8E0D2]">🎱 Billiard Hall</h1>
              <p className="text-lg" style={{ color: '#9B9182' }}>Table Status Display</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="flex items-center gap-3 text-[#E8E0D2]">
                  <Clock className="h-6 w-6" />
                  <div>
                    <div className="text-2xl font-bold">
                      {currentTime.toLocaleTimeString()}
                    </div>
                    <div className="text-sm" style={{ color: '#9B9182' }}>
                      {currentTime.toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </div>
                  </div>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => navigate('/')}
                style={{ 
                  borderColor: '#9B9182', 
                  color: '#2C3035',
                  backgroundColor: 'transparent'
                }}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to POS
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Display */}
      <main className="container mx-auto px-4 py-8">
        {activeTables.length === 0 ? (
          <Card className="text-center py-16" style={{ backgroundColor: '#E8E0D2', borderColor: '#414A52' }}>
            <CardContent>
              <div className="text-xl" style={{ color: '#414A52' }}>
                No active tables at the moment
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {activeTables.map(table => (
              <TableDisplay key={table.id} table={table} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function TableDisplay({ table }: { table: Table }) {
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    if (!table.startTime) {
      setElapsedTime(0);
      return;
    }

    // If session is stopped, freeze the timer at the stopped time
    if (table.endTime) {
      const finalElapsed = Math.floor((table.endTime - table.startTime) / 1000);
      setElapsedTime(finalElapsed);
      return; // Don't run interval for stopped sessions
    }

    // Use the database start time for persistent timer across reloads
    const startTime = table.startTime;

    // Initialize timer immediately with current elapsed time
    const now = Date.now();
    const initialElapsed = Math.floor((now - startTime) / 1000);
    setElapsedTime(initialElapsed);

    const interval = setInterval(() => {
      const now = Date.now();
      const elapsed = Math.floor((now - startTime) / 1000);
      setElapsedTime(elapsed);
    }, 1000);

    return () => clearInterval(interval);
  }, [table.startTime, table.endTime]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const orderCount = table.orders?.reduce((sum, order) => sum + order.quantity, 0) || 0;

  return (
    <Card className="shadow-lg border-2" style={{ backgroundColor: '#E8E0D2', borderColor: '#414A52' }}>
      <CardHeader className="pb-3" style={{ backgroundColor: '#2C3035' }}>
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl text-[#E8E0D2]">{table.name}</CardTitle>
          <Badge 
            className="text-lg px-3 py-1"
            style={{ 
              backgroundColor: table.mode === 'hour' ? '#9B9182' : '#414A52',
              color: '#E8E0D2'
            }}
          >
            {table.mode === 'hour' ? '1 Hour' : 'Open'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg p-4" style={{ backgroundColor: '#9B9182' }}>
          <div className="flex items-center justify-center gap-3">
            <Clock className="h-8 w-8" style={{ color: '#E8E0D2' }} />
            <div className="text-4xl font-bold text-[#E8E0D2]">
              {formatTime(elapsedTime)}
            </div>
          </div>
        </div>
        {orderCount > 0 && (
          <div className="text-center" style={{ color: '#414A52' }}>
            {orderCount} item{orderCount !== 1 ? 's' : ''} ordered
          </div>
        )}
      </CardContent>
    </Card>
  );
}
