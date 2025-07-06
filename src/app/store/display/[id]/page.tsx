'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Play, Pause, SkipBack, SkipForward, ArrowLeft, Maximize, Download, CheckCircle, AlertCircle, Wifi, WifiOff } from 'lucide-react';
import { mediaCacheManager } from '@/utils/mediaCache';
import { MediaItem } from '@/types';

// Mock display data
const mockDisplayData = {
  '1': {
    id: '1',
    name: 'Display Utama',
    mediaItems: [
      { id: '1', name: 'Promo Ramadan', url: 'https://picsum.photos/1920/1080?random=1', type: 'image', category: 'Promotion' as const, duration: 5 },
      { id: '2', name: 'Store Info', url: 'https://picsum.photos/1920/1080?random=2', type: 'image', category: 'Head Office' as const, duration: 7 },
      { id: '3', name: 'Product Showcase', url: 'https://picsum.photos/1920/1080?random=3', type: 'image', category: 'Store' as const, duration: 6 },
    ]
  },
  '2': {
    id: '2',
    name: 'Display Promo',
    mediaItems: [
      { id: '4', name: 'Special Offer', url: 'https://picsum.photos/1920/1080?random=4', type: 'image', category: 'Promotion' as const, duration: 8 },
      { id: '5', name: 'New Collection', url: 'https://picsum.photos/1920/1080?random=5', type: 'image', category: 'Store' as const, duration: 5 },
    ]
  }
};

export default function DisplayPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const displayId = params.id as string;
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false); // Start paused until media is cached
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [isOnline, setIsOnline] = useState(true);
  const [hideCursor, setHideCursor] = useState(false);
  
  // Cache management states
  const [cachedUrls, setCachedUrls] = useState<{ [key: string]: string }>({});
  const [cacheStatus, setCacheStatus] = useState<{
    isLoading: boolean;
    downloadedCount: number;
    totalCount: number;
    error?: string;
  }>({
    isLoading: true,
    downloadedCount: 0,
    totalCount: 0
  });

  const display = mockDisplayData[displayId as keyof typeof mockDisplayData];
  
  useEffect(() => {
    if (!user || user.role !== 'store') {
      router.push('/login');
      return;
    }
    
    if (!display) {
      router.push('/store');
      return;
    }
  }, [user, display, router]);

  // Network status monitoring
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    setIsOnline(navigator.onLine);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Cache all media items on component mount
  useEffect(() => {
    if (!display?.mediaItems) return;

    const cacheAllMedia = async () => {
      const totalItems = display.mediaItems.length;
      setCacheStatus(prev => ({ ...prev, totalCount: totalItems, isLoading: true }));
      
      try {
        const urlMapping: { [key: string]: string } = {};
        
        for (let i = 0; i < display.mediaItems.length; i++) {
          const mediaItem = display.mediaItems[i];
          
          try {
            // Try to get cached URL first
            let cachedUrl = await mediaCacheManager.getCachedMediaUrl(mediaItem.id);
            
            if (!cachedUrl) {
              // If not cached, cache it now
              await mediaCacheManager.cacheMedia(mediaItem);
              cachedUrl = await mediaCacheManager.getCachedMediaUrl(mediaItem.id);
            }
            
            if (cachedUrl) {
              urlMapping[mediaItem.id] = cachedUrl;
            } else {
              // Fallback to original URL if caching fails
              urlMapping[mediaItem.id] = mediaItem.url;
            }
            
            setCacheStatus(prev => ({ 
              ...prev, 
              downloadedCount: i + 1 
            }));
            
          } catch (error) {
            console.error(`Error caching media ${mediaItem.id}:`, error);
            // Use original URL as fallback
            urlMapping[mediaItem.id] = mediaItem.url;
            setCacheStatus(prev => ({ 
              ...prev, 
              downloadedCount: i + 1 
            }));
          }
        }
        
        setCachedUrls(urlMapping);
        setCacheStatus(prev => ({ 
          ...prev, 
          isLoading: false 
        }));
        
        // Auto-start slideshow after caching is complete
        setIsPlaying(true);
        
      } catch (error) {
        console.error('Error during media caching:', error);
        setCacheStatus(prev => ({ 
          ...prev, 
          isLoading: false,
          error: 'Failed to cache media. Running in online mode.'
        }));
        
        // Fallback: use original URLs
        const fallbackUrls: { [key: string]: string } = {};
        display.mediaItems.forEach(item => {
          fallbackUrls[item.id] = item.url;
        });
        setCachedUrls(fallbackUrls);
        setIsPlaying(true);
      }
    };

    cacheAllMedia();
  }, [display?.mediaItems]);

  const currentMedia = display?.mediaItems[currentIndex];
  const totalItems = display?.mediaItems.length || 0;
  const currentMediaUrl = currentMedia ? cachedUrls[currentMedia.id] || currentMedia.url : '';

  // Auto-advance slideshow
  useEffect(() => {
    if (!isPlaying || !currentMedia || cacheStatus.isLoading) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev + (100 / (currentMedia.duration * 10));
        if (newProgress >= 100) {
          nextSlide();
          return 0;
        }
        return newProgress;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isPlaying, currentIndex, currentMedia, cacheStatus.isLoading]);

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % totalItems);
    setProgress(0);
  }, [totalItems]);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + totalItems) % totalItems);
    setProgress(0);
  }, [totalItems]);

  const togglePlayPause = useCallback(() => {
    if (cacheStatus.isLoading) return; // Don't allow play until caching is done
    setIsPlaying(!isPlaying);
  }, [isPlaying, cacheStatus.isLoading]);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  // Enhanced keyboard controls for Android TV
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      switch (e.key) {
        case ' ':
        case 'Enter': // Android TV OK button
          e.preventDefault();
          togglePlayPause();
          break;
        case 'ArrowRight':
        case 'ArrowDown':
          e.preventDefault();
          nextSlide();
          break;
        case 'ArrowLeft':
        case 'ArrowUp':
          e.preventDefault();
          prevSlide();
          break;
        case 'f':
        case 'F':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'Escape':
        case 'Back': // Android TV back button
          e.preventDefault();
          if (isFullscreen) {
            document.exitFullscreen();
            setIsFullscreen(false);
          } else {
            router.push('/store');
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [togglePlayPause, nextSlide, prevSlide, toggleFullscreen, isFullscreen, router]);

  // Auto-hide controls and cursor for TV experience
  useEffect(() => {
    const controlsTimer = setTimeout(() => {
      setShowControls(false);
    }, 5000); // Longer timeout for TV

    const cursorTimer = setTimeout(() => {
      setHideCursor(true);
    }, 3000);

    return () => {
      clearTimeout(controlsTimer);
      clearTimeout(cursorTimer);
    };
  }, [showControls]);

  const handleMouseMove = () => {
    setShowControls(true);
    setHideCursor(false);
  };

  const handleClick = () => {
    setShowControls(true);
    setHideCursor(false);
  };

  if (!user || user.role !== 'store' || !display) {
    return null;
  }

  return (
    <div 
      className={`slideshow-container bg-black text-white relative tv-no-select ${hideCursor ? 'hide-cursor' : ''}`}
      onMouseMove={handleMouseMove}
      onClick={handleClick}
    >
      {/* Network status indicator */}
      <div className={`network-status ${isOnline ? 'network-online' : 'network-offline'}`}>
        {isOnline ? (
          <><Wifi className="w-4 h-4 inline mr-2" />Online</>
        ) : (
          <><WifiOff className="w-4 h-4 inline mr-2" />Offline Mode</>
        )}
      </div>

      {/* Loading overlay */}
      {cacheStatus.isLoading && (
        <div className="absolute inset-0 bg-black/90 flex items-center justify-center z-50">
          <div className="text-center">
            <Download className="w-20 h-20 mx-auto mb-6 tv-loading" />
            <h2 className="text-3xl font-bold mb-4 tv-text-scale">Downloading Media for Offline Playback</h2>
            <p className="text-xl opacity-75 mb-6">
              {cacheStatus.downloadedCount} of {cacheStatus.totalCount} files cached
            </p>
            <div className="w-96 tv-progress mx-auto">
              <div 
                className="tv-progress-fill cache-progress"
                style={{ 
                  width: `${cacheStatus.totalCount > 0 ? (cacheStatus.downloadedCount / cacheStatus.totalCount) * 100 : 0}%` 
                }}
              />
            </div>
            <p className="text-lg opacity-60 mt-4">
              Media will be available offline after download completes
            </p>
          </div>
        </div>
      )}

      {/* Error notification */}
      {cacheStatus.error && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 cache-indicator bg-yellow-600/90 text-white px-6 py-3 rounded-lg flex items-center gap-3 z-40 text-lg">
          <AlertCircle className="w-5 h-5" />
          {cacheStatus.error}
        </div>
      )}

      {/* Cache success indicator */}
      {!cacheStatus.isLoading && !cacheStatus.error && (
        <div className="absolute top-4 right-4 cache-indicator bg-green-600/90 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-base z-40">
          <CheckCircle className="w-5 h-5" />
          Offline Ready
        </div>
      )}

      {/* Current slide */}
      {currentMedia && currentMediaUrl && (
        <div className={`slide active absolute inset-0 ${isFullscreen ? 'fullscreen-slide' : ''}`}>
          {currentMedia.type.startsWith('image') ? (
            <img
              src={currentMediaUrl}
              alt={currentMedia.name}
              className="w-full h-full object-contain"
            />
          ) : (
            <video
              src={currentMediaUrl}
              className="w-full h-full object-contain"
              autoPlay
              muted
              loop
              playsInline // Important for mobile/TV compatibility
            />
          )}
        </div>
      )}

      {/* Controls overlay */}
      <div 
        className={`absolute inset-0 transition-opacity duration-500 tv-overlay ${
          showControls ? 'opacity-100' : 'opacity-0'
        } ${cacheStatus.isLoading ? 'pointer-events-none' : ''}`}
      >
        {/* Top bar */}
        <div className="absolute top-0 left-0 right-0 p-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold tv-text-scale">{display.name}</h1>
              <p className="text-xl opacity-75 tv-text-scale">
                {currentIndex + 1} of {totalItems} • {currentMedia?.name}
              </p>
            </div>
            <Button
              onClick={() => router.push('/store')}
              variant="ghost"
              size="lg"
              className="text-white hover:bg-white/20 text-xl px-8 py-4 tv-focus"
            >
              <ArrowLeft className="w-6 h-6 mr-3" />
              Back
            </Button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="absolute bottom-32 left-8 right-8">
          <div className="tv-progress">
            <div 
              className="tv-progress-fill"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Bottom controls */}
        <div className="absolute bottom-0 left-0 right-0 p-8">
          <div className="flex justify-center items-center gap-8">
            <Button
              onClick={prevSlide}
              variant="ghost"
              size="lg"
              className="text-white hover:bg-white/20 p-6 tv-focus"
              disabled={cacheStatus.isLoading}
            >
              <SkipBack className="w-10 h-10" />
            </Button>
            
            <Button
              onClick={togglePlayPause}
              variant="ghost"
              size="lg"
              className="text-white hover:bg-white/20 p-6 tv-focus"
              disabled={cacheStatus.isLoading}
            >
              {isPlaying ? (
                <Pause className="w-10 h-10" />
              ) : (
                <Play className="w-10 h-10" />
              )}
            </Button>
            
            <Button
              onClick={nextSlide}
              variant="ghost"
              size="lg"
              className="text-white hover:bg-white/20 p-6 tv-focus"
              disabled={cacheStatus.isLoading}
            >
              <SkipForward className="w-10 h-10" />
            </Button>
            
            {!isFullscreen && (
              <Button
                onClick={toggleFullscreen}
                variant="ghost"
                size="lg"
                className="text-white hover:bg-white/20 ml-8 p-6 tv-focus"
              >
                <Maximize className="w-10 h-10" />
              </Button>
            )}
          </div>
        </div>

        {/* Slide indicators */}
        <div className="absolute bottom-48 left-1/2 transform -translate-x-1/2">
          <div className="flex gap-4">
            {display.mediaItems.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  if (!cacheStatus.isLoading) {
                    setCurrentIndex(index);
                    setProgress(0);
                  }
                }}
                className={`w-5 h-5 rounded-full transition-all tv-focus ${
                  index === currentIndex 
                    ? 'bg-white' 
                    : 'bg-white/40 hover:bg-white/60'
                } ${cacheStatus.isLoading ? 'cursor-not-allowed opacity-50' : ''}`}
                disabled={cacheStatus.isLoading}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Keyboard shortcuts help */}
      {showControls && !cacheStatus.isLoading && (
        <div className="absolute top-8 right-8 cache-indicator bg-black/80 rounded-lg p-6 text-base">
          <div className="space-y-3 text-white/90 tv-text-scale">
            <div><span className="font-semibold">Space/Enter:</span> Play/Pause</div>
            <div><span className="font-semibold">←→ ↑↓:</span> Navigate</div>
            <div><span className="font-semibold">F:</span> Fullscreen</div>
            <div><span className="font-semibold">Esc/Back:</span> Exit</div>
          </div>
        </div>
      )}
    </div>
  );
} 