'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Monitor, Play } from 'lucide-react';
import { Display } from '@/types';

export default function StorePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [displays, setDisplays] = useState<Display[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user || user.role !== 'store') {
      router.push('/');
      return;
    }

    fetchDisplays();
  }, [user, router]);

  const fetchDisplays = async () => {
    if (!user?.clientId) return;
    
    try {
      setLoading(true);
      const response = await fetch(`/api/clients/${user.clientId}/displays`);
      
      if (response.ok) {
        const clientDisplays = await response.json();
        setDisplays(clientDisplays);
      } else {
        setError('Failed to load displays');
      }
    } catch (error) {
      console.error('Error fetching displays:', error);
      setError('Failed to load displays');
    } finally {
      setLoading(false);
    }
  };

  const handlePlayDisplay = (displayId: string) => {
    if (!user?.clientId) return;
    router.push(`/client/${user.clientId}/display/${displayId}`);
  };

  if (!user || user.role !== 'store') {
    return null;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading displays...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Store Dashboard</h1>
        <p className="text-gray-600">{user.clientName}</p>
        <div className="flex items-center gap-4 mt-2">
          <span className="text-sm text-gray-500">PIN: {user.clientId}</span>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Available Displays</h2>
        <p className="text-gray-600">Select a display to start the slideshow</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {displays.map((display) => (
          <Card key={display.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Monitor className="w-8 h-8 text-blue-600" />
                <div>
                  <CardTitle className="text-lg">{display.name}</CardTitle>
                  <CardDescription>
                    {display.mediaItems?.length || 0} media files
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Media Preview:</h4>
                  <div className="space-y-1">
                    {(display.mediaItems || []).slice(0, 3).map((media) => (
                      <div key={media.id} className="flex justify-between text-xs text-gray-500">
                        <span>{media.name}</span>
                        <span>{media.duration}s</span>
                      </div>
                    ))}
                    {(display.mediaItems?.length || 0) > 3 && (
                      <div className="text-xs text-gray-400">
                        +{(display.mediaItems?.length || 0) - 3} more...
                      </div>
                    )}
                  </div>
                </div>
                
                <Button 
                  onClick={() => handlePlayDisplay(display.id)}
                  className="w-full"
                  size="lg"
                  disabled={!display.mediaItems || display.mediaItems.length === 0}
                >
                  <Play className="w-5 h-5 mr-2" />
                  {display.mediaItems && display.mediaItems.length > 0 
                    ? 'Start Slideshow' 
                    : 'No Media Available'
                  }
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {displays.length === 0 && !loading && (
        <Card>
          <CardContent className="p-8 text-center">
            <Monitor className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No Displays Available</h3>
            <p className="text-gray-500">
              Contact your administrator to set up displays for this store.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="mt-8 text-center">
        <p className="text-sm text-gray-500">
          Use the remote control or keyboard to navigate the slideshow.
          <br />
          Press F for fullscreen, Space to play/pause, Arrow keys to navigate.
        </p>
      </div>
    </div>
  );
} 