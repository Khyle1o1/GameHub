import { useState, useEffect } from 'react';
import { ArrowLeft, Save, Clock, DollarSign, Table, CheckCircle, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useNavigate } from 'react-router-dom';
import { usePosStore } from '@/hooks/usePosStore';
import { useToast } from '@/hooks/use-toast';

export default function SettingsScreen() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { 
    hourlyRate, 
    setHourlyRate, 
    halfHourRate, 
    setHalfHourRate, 
    saveSettings,
    tables,
    setTableCount
  } = usePosStore();
  
  const [localHourlyRate, setLocalHourlyRate] = useState(hourlyRate);
  const [localHalfHourRate, setLocalHalfHourRate] = useState(halfHourRate);
  const [localTableCount, setLocalTableCount] = useState(tables.length);
  const [isSaving, setIsSaving] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  

  useEffect(() => {
    setLocalHourlyRate(hourlyRate);
    setLocalHalfHourRate(halfHourRate);
    setLocalTableCount(tables.length);
    
    // Update current time every second
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timeInterval);
  }, [hourlyRate, halfHourRate, tables.length]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveSettings({
        hourlyRate: localHourlyRate,
        halfHourRate: localHalfHourRate,
        tableCount: localTableCount,
      });
      
      // Show success notification
      toast({
        title: "Settings Saved Successfully!",
        description: "Your pricing configuration has been updated and saved.",
        duration: 3000,
      });
    } catch (error) {
      console.error('Failed to save settings:', error);
      
      // Show error notification
      toast({
        title: "Failed to Save Settings",
        description: "There was an error saving your settings. Please try again.",
        variant: "destructive",
        duration: 4000,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setLocalHourlyRate(hourlyRate);
    setLocalHalfHourRate(halfHourRate);
    setLocalTableCount(tables.length);
  };

  const hasChanges = localHourlyRate !== hourlyRate || localHalfHourRate !== halfHourRate || localTableCount !== tables.length;


  return (
    <div className="min-h-screen" style={{ backgroundColor: '#E8E0D2' }}>
      {/* Header */}
      <header className="border-b shadow-lg" style={{ backgroundColor: '#2C313A', borderColor: '#404750' }}>
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={() => navigate('/')}
                style={{ 
                  borderColor: '#9B9182', 
                  color: '#E8E0D2',
                  backgroundColor: 'transparent'
                }}
                className="hover:bg-opacity-10 hover:bg-white"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to POS
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-white">Settings</h1>
                <p className="text-sm" style={{ color: '#9B9182' }}>Configure pricing and system preferences</p>
              </div>
            </div>
            
            {/* Date and Time Display */}
            <div className="text-right">
              <div className="flex items-center gap-2 text-white">
                <Clock className="h-4 w-4" />
                <div>
                  <div className="text-lg font-bold">
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
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Pricing Configuration */}
          <Card className="shadow-sm" style={{ backgroundColor: '#E8E0D2', borderColor: '#9B9182' }}>
            <CardHeader style={{ backgroundColor: '#2C313A' }}>
              <CardTitle className="text-lg text-white font-semibold flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Pricing Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="tableCount" className="text-sm font-medium" style={{ color: '#2C313A' }}>
                    <Table className="h-4 w-4 inline mr-2" />
                    Number of Tables
                  </Label>
                  <Input
                    id="tableCount"
                    type="number"
                    value={localTableCount}
                    onChange={(e) => setLocalTableCount(Number(e.target.value))}
                    min="1"
                    max="20"
                    step="1"
                    className="border-slate-300 focus:border-slate-500"
                    style={{ backgroundColor: 'white' }}
                  />
                  <p className="text-xs" style={{ color: '#404750' }}>
                    Set the number of billiard tables (1-20)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hourlyRate" className="text-sm font-medium" style={{ color: '#2C313A' }}>
                    <Clock className="h-4 w-4 inline mr-2" />
                    1 Hour Rate (₱)
                  </Label>
                  <Input
                    id="hourlyRate"
                    type="number"
                    value={localHourlyRate}
                    onChange={(e) => setLocalHourlyRate(Number(e.target.value))}
                    min="0"
                    step="1"
                    className="border-slate-300 focus:border-slate-500"
                    style={{ backgroundColor: 'white' }}
                  />
                  <p className="text-xs" style={{ color: '#404750' }}>
                    Base rate for the first hour of play
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="halfHourRate" className="text-sm font-medium" style={{ color: '#2C313A' }}>
                    <Clock className="h-4 w-4 inline mr-2" />
                    30 Minutes Rate (₱)
                  </Label>
                  <Input
                    id="halfHourRate"
                    type="number"
                    value={localHalfHourRate}
                    onChange={(e) => setLocalHalfHourRate(Number(e.target.value))}
                    min="0"
                    step="1"
                    className="border-slate-300 focus:border-slate-500"
                    style={{ backgroundColor: 'white' }}
                  />
                  <p className="text-xs" style={{ color: '#404750' }}>
                    Additional rate for every 30 minutes beyond the first hour
                  </p>
                </div>
              </div>

              {/* Pricing Preview */}
              <div className="p-4 rounded-lg border" style={{ backgroundColor: '#E8E0D2', borderColor: '#9B9182' }}>
                <h4 className="font-semibold mb-3" style={{ color: '#2C313A' }}>Pricing Preview (Open Time)</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span style={{ color: '#404750' }}>0-30 mins:</span>
                    <span className="font-medium" style={{ color: '#2C313A' }}>₱{localHalfHourRate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: '#404750' }}>31-60 mins (1 hour):</span>
                    <span className="font-medium" style={{ color: '#2C313A' }}>₱{localHourlyRate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: '#404750' }}>1 hour 30 mins:</span>
                    <span className="font-medium" style={{ color: '#2C313A' }}>₱{localHourlyRate + localHalfHourRate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: '#404750' }}>2 hours:</span>
                    <span className="font-medium" style={{ color: '#2C313A' }}>₱{localHourlyRate + localHourlyRate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: '#404750' }}>2 hours 30 mins:</span>
                    <span className="font-medium" style={{ color: '#2C313A' }}>₱{localHourlyRate * 2 + localHalfHourRate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: '#404750' }}>3 hours:</span>
                    <span className="font-medium" style={{ color: '#2C313A' }}>₱{localHourlyRate * 3}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleSave}
                  disabled={!hasChanges || isSaving}
                  className="flex-1 text-white"
                  style={{ 
                    backgroundColor: hasChanges ? '#404750' : '#9B9182',
                    color: '#E8E0D2'
                  }}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isSaving ? 'Saving...' : 'Save Settings'}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleReset}
                  disabled={!hasChanges}
                  className="flex-1"
                  style={{ 
                    borderColor: '#9B9182', 
                    color: '#2C313A',
                    backgroundColor: 'transparent'
                  }}
                >
                  Reset
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Inventory Management Note */}
          <Card className="shadow-sm" style={{ backgroundColor: '#E8E0D2', borderColor: '#9B9182' }}>
            <CardContent className="p-6">
              <div className="text-center">
                <div className="mb-4">
                  <Package className="h-12 w-12 mx-auto mb-3" style={{ color: '#404750' }} />
                  <h3 className="text-lg font-semibold mb-2" style={{ color: '#2C313A' }}>
                    Product & Inventory Management
                  </h3>
                  <p className="text-sm" style={{ color: '#404750' }}>
                    Manage your products, track inventory, and monitor stock levels in the dedicated Inventory page.
                  </p>
                </div>
                <Button
                  onClick={() => navigate('/inventory')}
                  className="text-white"
                  style={{ backgroundColor: '#404750' }}
                >
                  <Package className="h-4 w-4 mr-2" />
                  Go to Inventory
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* System Information */}
          <Card className="shadow-sm" style={{ backgroundColor: '#E8E0D2', borderColor: '#9B9182' }}>
            <CardHeader style={{ backgroundColor: '#404750' }}>
              <CardTitle className="text-lg text-white font-semibold">System Information</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span style={{ color: '#404750' }}>Number of Tables:</span>
                  <span className="font-medium" style={{ color: '#2C313A' }}>{tables.length}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: '#404750' }}>Current 1 Hour Rate:</span>
                  <span className="font-medium" style={{ color: '#2C313A' }}>₱{hourlyRate}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: '#404750' }}>Current 30 Min Rate:</span>
                  <span className="font-medium" style={{ color: '#2C313A' }}>₱{halfHourRate}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: '#404750' }}>Settings Status:</span>
                  <span className="font-medium" style={{ color: '#2C313A' }}>Saved</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
