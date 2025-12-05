import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, AlertCircle, Loader2, ExternalLink, Video, MonitorPlay } from 'lucide-react';

interface OBSStatus {
  installed: boolean;
  running: boolean;
  configured: boolean;
  configDir: string | null;
}

interface OBSSetupResponse {
  success: boolean;
  message?: string;
  error?: string;
  nextSteps?: string[];
}

export function OBSSetupPanel() {
  const [status, setStatus] = useState<OBSStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [setupLoading, setSetupLoading] = useState(false);
  const [setupResult, setSetupResult] = useState<OBSSetupResponse | null>(null);

  const fetchStatus = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/obs/status');
      const data = await response.json();
      if (data.success) {
        setStatus(data.obs);
      }
    } catch (error) {
      console.error('Failed to fetch OBS status:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleSetup = async () => {
    setSetupLoading(true);
    setSetupResult(null);
    
    try {
      const response = await fetch('http://localhost:3001/api/obs/setup', {
        method: 'POST'
      });
      const data = await response.json();
      setSetupResult(data);
      
      // Refresh status after setup
      if (data.success) {
        setTimeout(() => fetchStatus(), 1000);
      }
    } catch (error) {
      setSetupResult({
        success: false,
        error: 'Failed to setup OBS. Please try again.'
      });
    } finally {
      setSetupLoading(false);
    }
  };

  const openOBSDownload = () => {
    window.open('https://obsproject.com/download', '_blank');
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="h-5 w-5" />
            OBS Virtual Camera Setup
          </CardTitle>
          <CardDescription>Setting up OBS for Zoom integration</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Video className="h-5 w-5" />
          OBS Virtual Camera Setup
        </CardTitle>
        <CardDescription>
          Configure OBS Studio to use vendVision as a virtual webcam in Zoom
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Status Overview */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">OBS Installed</span>
            {status?.installed ? (
              <Badge variant="default" className="gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Installed
              </Badge>
            ) : (
              <Badge variant="destructive" className="gap-1">
                <XCircle className="h-3 w-3" />
                Not Installed
              </Badge>
            )}
          </div>
          
          {status?.installed && (
            <>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Auto-Configured</span>
                {status?.configured ? (
                  <Badge variant="default" className="gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Configured
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Not Configured
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">OBS Running</span>
                {status?.running ? (
                  <Badge variant="outline" className="gap-1">
                    <MonitorPlay className="h-3 w-3" />
                    Running
                  </Badge>
                ) : (
                  <Badge variant="outline" className="gap-1">
                    Stopped
                  </Badge>
                )}
              </div>
            </>
          )}
        </div>

        {/* Installation Instructions */}
        {!status?.installed && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>OBS Studio Required</AlertTitle>
            <AlertDescription className="space-y-2">
              <p>Please install OBS Studio to use the virtual camera feature:</p>
              <ol className="list-decimal list-inside space-y-1 text-sm mt-2">
                <li>Download OBS Studio from obsproject.com</li>
                <li>Install and launch it once</li>
                <li>Return here and click "Auto-Configure OBS"</li>
              </ol>
            </AlertDescription>
          </Alert>
        )}

        {/* Configuration Instructions */}
        {status?.installed && !status?.configured && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Ready to Configure</AlertTitle>
            <AlertDescription>
              Click the button below to automatically configure OBS with the perfect settings for vendVision demos.
            </AlertDescription>
          </Alert>
        )}

        {/* Already Configured */}
        {status?.installed && status?.configured && (
          <Alert className="border-green-200 bg-green-50 text-green-900">
            <CheckCircle2 className="h-4 w-4" />
            <AlertTitle>OBS is Ready!</AlertTitle>
            <AlertDescription className="space-y-2">
              <p>Your OBS is configured for vendVision.</p>
              <div className="mt-2 space-y-1 text-sm">
                <p className="font-medium">Next steps:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Launch OBS Studio</li>
                  <li>Click "Start Virtual Camera"</li>
                  <li>In Zoom: Settings → Video → Select "OBS Virtual Camera"</li>
                </ol>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Setup Result */}
        {setupResult && (
          <Alert className={setupResult.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
            {setupResult.success ? (
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            ) : (
              <XCircle className="h-4 w-4 text-red-600" />
            )}
            <AlertTitle className={setupResult.success ? 'text-green-900' : 'text-red-900'}>
              {setupResult.success ? 'Setup Complete!' : 'Setup Failed'}
            </AlertTitle>
            <AlertDescription className={setupResult.success ? 'text-green-800' : 'text-red-800'}>
              {setupResult.message || setupResult.error}
              {setupResult.nextSteps && (
                <ol className="list-decimal list-inside space-y-1 mt-2">
                  {setupResult.nextSteps.map((step, idx) => (
                    <li key={idx}>{step}</li>
                  ))}
                </ol>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Warning if OBS is running */}
        {status?.running && !status?.configured && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>OBS is Running</AlertTitle>
            <AlertDescription>
              Please close OBS before running auto-configuration.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>

      <CardFooter className="flex gap-2">
        {!status?.installed ? (
          <Button onClick={openOBSDownload} className="gap-2">
            <ExternalLink className="h-4 w-4" />
            Download OBS Studio
          </Button>
        ) : !status?.configured ? (
          <Button 
            onClick={handleSetup} 
            disabled={setupLoading || status?.running}
            className="gap-2"
          >
            {setupLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Configuring...
              </>
            ) : (
              <>
                <Video className="h-4 w-4" />
                Auto-Configure OBS
              </>
            )}
          </Button>
        ) : (
          <Button variant="outline" onClick={fetchStatus} className="gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Refresh Status
          </Button>
        )}
        
        <Button 
          variant="outline" 
          onClick={() => window.open('https://obsproject.com/kb', '_blank')}
          className="gap-2"
        >
          <ExternalLink className="h-4 w-4" />
          OBS Documentation
        </Button>
      </CardFooter>
    </Card>
  );
}

