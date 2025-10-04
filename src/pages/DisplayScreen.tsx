import { useState, useEffect } from 'react';
import { ArrowLeft, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { Table } from '@/types/pos';
import { calculateElapsedTime, formatTime } from '@/utils/timeCalculations';

export default function DisplayScreen() {
  const navigate = useNavigate();
  const [tables, setTables] = useState<Table[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Load tables from localStorage
  useEffect(() => {
    const loadTables = () => {
      const stored = localStorage.getItem('billiard-pos-state');
      if (stored) {
        const state = JSON.parse(stored);
        setTables(state.tables || []);
      }
    };

    // Initial load
    loadTables();

    // Listen for storage changes
    const handleStorageChange = () => {
      loadTables();
    };

    window.addEventListener('storage', handleStorageChange);

    // Update current time every second
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(timeInterval);
    };
  }, []);

  const activeTables = tables.filter(t => t.isActive);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-primary">🎱 Billiard Hall</h1>
              <p className="text-lg text-muted-foreground">Table Status Display</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-2xl font-bold">
                  {currentTime.toLocaleTimeString()}
                </div>
                <div className="text-sm text-muted-foreground">
                  {currentTime.toLocaleDateString()}
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => navigate('/')}
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
          <Card className="text-center py-16">
            <CardContent>
              <div className="text-muted-foreground text-xl">
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
    if (!table.startTime) return;

    const interval = setInterval(() => {
      setElapsedTime(calculateElapsedTime(table.startTime!));
    }, 1000);

    return () => clearInterval(interval);
  }, [table.startTime]);

  const orderCount = table.orders.reduce((sum, order) => sum + order.quantity, 0);

  return (
    <Card className="border-success shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl">{table.name}</CardTitle>
          <Badge className="bg-success text-lg px-3 py-1">
            {table.mode === 'hour' ? '1 Hour' : 'Open'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-primary/10 rounded-lg p-4">
          <div className="flex items-center justify-center gap-3">
            <Clock className="h-8 w-8 text-primary" />
            <div className="text-4xl font-bold text-primary">
              {formatTime(elapsedTime)}
            </div>
          </div>
        </div>
        {orderCount > 0 && (
          <div className="text-center text-muted-foreground">
            {orderCount} item{orderCount !== 1 ? 's' : ''} ordered
          </div>
        )}
      </CardContent>
    </Card>
  );
}
