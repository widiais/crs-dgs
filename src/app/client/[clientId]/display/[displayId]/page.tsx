'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Play, Pause, SkipBack, SkipForward, ArrowLeft, Maximize } from 'lucide-react';
import { Display, MediaItem } from '@/types';

export default function DisplaySlideshowPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const clientId = params.clientId as string;
  const displayId = params.displayId as string;
  
  const [display, setDisplay] = useState<Display | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState(0);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const progressTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!user || user.role !== 'store') {
      router.push('/');
      return;
    }

    if (user.clientId !== clientId) {
      router.push('/store');
      return;
    }

    fetchDisplayData();
  }, [user, clientId, displayId, router]);

  const fetchDisplayData = async () => {
    try {
      const response = await fetch(`/api/displays/${displayId}?clientId=${clientId}`);
      if (response.ok) {
        const displayData = await response.json();
        setDisplay(displayData);
        setCurrentIndex(0); // Reset to first media
      } else {
        console.error('Failed to fetch display data');
        router.push('/store');
      }
    } catch (error) {
      console.error('Error fetching display:', error);
      router.push('/store');
    }
  };

  const currentMedia = display?.mediaItems?.[currentIndex];
  const totalItems = display?.mediaItems?.length || 0;

  // Clear all timers
  const clearTimers = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
    }
  }, []);

  // Next slide function
  const nextSlide = useCallback(() => {
    if (totalItems > 0) {
      setCurrentIndex((prev) => (prev + 1) % totalItems);
    }
  }, [totalItems]);

  // Previous slide function
  const prevSlide = useCallback(() => {
    if (totalItems > 0) {
      setCurrentIndex((prev) => (prev - 1 + totalItems) % totalItems);
    }
  }, [totalItems]);

  // Start media timer for images
  const startImageTimer = useCallback(() => {
    if (!currentMedia || !isPlaying || !currentMedia.type.startsWith('image/')) return;

    clearTimers();
    setProgress(0);
    
    const duration = currentMedia.duration * 1000; // Convert to milliseconds
    setTimeRemaining(currentMedia.duration);

    // Progress timer (updates every 100ms)
    progressTimerRef.current = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + (100 / duration) * 100;
        return Math.min(newProgress, 100);
      });
      
      setTimeRemaining(prev => Math.max(prev - 0.1, 0));
    }, 100);

    // Media completion timer
    timerRef.current = setTimeout(() => {
      nextSlide();
    }, duration);
  }, [currentMedia, isPlaying, clearTimers, nextSlide]);

  // Handle video events
  const handleVideoEnd = useCallback(() => {
    console.log('Video ended naturally, but will be controlled by duration timer');
    // Don't auto-advance here, let the duration timer handle it
  }, []);

  const handleVideoPlay = useCallback(() => {
    console.log('Video started playing');
    if (currentMedia?.type.startsWith('video/')) {
      setProgress(0);
      setTimeRemaining(currentMedia.duration);
      
      // Set timer based on custom duration, not video length
      clearTimers();
      
      // Progress timer for video
      progressTimerRef.current = setInterval(() => {
        setProgress(prev => {
          const newProgress = prev + (100 / (currentMedia.duration * 1000)) * 100;
          return Math.min(newProgress, 100);
        });
        
        setTimeRemaining(prev => Math.max(prev - 0.1, 0));
      }, 100);
      
      // Duration timer - will stop video and advance
      timerRef.current = setTimeout(() => {
        console.log('Duration timer triggered, stopping video and advancing');
        if (videoRef.current) {
          videoRef.current.pause();
          videoRef.current.currentTime = 0;
        }
        nextSlide();
      }, currentMedia.duration * 1000);
    }
  }, [currentMedia, clearTimers, nextSlide]);

  // Auto-advance slideshow when media changes or play state changes
  useEffect(() => {
    console.log('Media changed:', currentMedia?.name, 'Type:', currentMedia?.type);
    
    if (!currentMedia || totalItems === 0) return;

    if (currentMedia.type.startsWith('image/')) {
      console.log('Starting image timer for:', currentMedia.name);
      startImageTimer();
    } else if (currentMedia.type.startsWith('video/')) {
      console.log('Setting up video for:', currentMedia.name);
      clearTimers();
      setProgress(0);
      setTimeRemaining(currentMedia.duration);
      
      // Video will start its own timer when it plays
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
      }
    }

    return () => {
      clearTimers();
    };
  }, [currentIndex, currentMedia, totalItems, startImageTimer, clearTimers]);

  // Handle play/pause state changes
  useEffect(() => {
    if (!currentMedia) return;

    if (isPlaying) {
      if (currentMedia.type.startsWith('image/')) {
        startImageTimer();
      } else if (currentMedia.type.startsWith('video/') && videoRef.current) {
        videoRef.current.play().catch(console.error);
      }
    } else {
      clearTimers();
      if (currentMedia.type.startsWith('video/') && videoRef.current) {
        videoRef.current.pause();
      }
    }
  }, [isPlaying, currentMedia, startImageTimer, clearTimers]);

  const togglePlayPause = useCallback(() => {
    setIsPlaying(prev => !prev);
  }, []);

  const toggleFullscreen = useCallback(() => {
    try {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().then(() => {
          setIsFullscreen(true);
        }).catch((err) => {
          console.error('Error entering fullscreen:', err);
        });
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen().then(() => {
            setIsFullscreen(false);
          }).catch((err) => {
            console.error('Error exiting fullscreen:', err);
          });
        }
      }
    } catch (error) {
      console.error('Fullscreen error:', error);
    }
  }, []);

  // Keyboard controls
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      switch (e.key) {
        case ' ':
          e.preventDefault();
          togglePlayPause();
          break;
        case 'ArrowRight':
          nextSlide();
          break;
        case 'ArrowLeft':
          prevSlide();
          break;
        case 'f':
        case 'F':
          toggleFullscreen();
          break;
        case 'Escape':
          if (isFullscreen && document.exitFullscreen) {
            document.exitFullscreen().then(() => {
              setIsFullscreen(false);
            }).catch((err) => {
              console.error('Error exiting fullscreen on escape:', err);
            });
          }
          break;
        case 'r':
        case 'R':
          fetchDisplayData();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [togglePlayPause, nextSlide, prevSlide, toggleFullscreen, isFullscreen]);

  // Hide controls after inactivity
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowControls(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, [showControls]);

  const handleMouseMove = () => {
    setShowControls(true);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => clearTimers();
  }, [clearTimers]);

  if (!user || user.role !== 'store' || !display) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading slideshow...</p>
        </div>
      </div>
    );
  }

  if (!currentMedia || totalItems === 0) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-center">
          <h2 className="text-2xl font-bold mb-4">No Media Available</h2>
          <p className="mb-4">No media files have been assigned to this display.</p>
          <Button
            onClick={() => router.push('/store')}
            variant="outline"
            className="text-white border-white hover:bg-white hover:text-black"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Store
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="slideshow-container bg-black text-white"
      onMouseMove={handleMouseMove}
    >
      {/* Current slide */}
      <div className="slide active">
        {currentMedia.type.startsWith('image/') ? (
          <img
            src={currentMedia.url}
            alt={currentMedia.name}
            className="w-full h-full object-contain"
            onLoad={() => console.log('Image loaded:', currentMedia.name)}
            onError={() => console.error('Image failed to load:', currentMedia.name)}
          />
        ) : (
          <video
            ref={videoRef}
            src={currentMedia.url}
            className="w-full h-full object-contain"
            autoPlay={isPlaying}
            muted
            onPlay={handleVideoPlay}
            onEnded={handleVideoEnd}
            onLoadedData={() => console.log('Video loaded:', currentMedia.name)}
            onError={() => console.error('Video failed to load:', currentMedia.name)}
            controls={false}
          />
        )}
      </div>

      {/* Controls overlay */}
      <div 
        className={`absolute inset-0 transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {/* Top bar */}
        <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/50 to-transparent p-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl font-bold">{display.name}</h1>
              <p className="text-sm opacity-75">
                {currentIndex + 1} of {totalItems} • {currentMedia.name}
              </p>
              <p className="text-xs opacity-60">
                {currentMedia.category} • {Math.ceil(timeRemaining)}s remaining • {currentMedia.type.startsWith('image/') ? 'Image' : 'Video'}
              </p>
            </div>
            <Button
              onClick={() => router.push('/store')}
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Store
            </Button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="absolute bottom-20 left-4 right-4">
          <div className="bg-white/20 rounded-full h-2">
            <div 
              className="bg-white rounded-full h-2 transition-all duration-100"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between text-xs mt-1 opacity-60">
            <span>{currentMedia.type.startsWith('image/') ? 'Image' : 'Video'}</span>
            <span>{currentMedia.duration}s duration</span>
          </div>
        </div>

        {/* Bottom controls */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-4">
          <div className="flex justify-center items-center gap-4">
            <Button
              onClick={prevSlide}
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
            >
              <SkipBack className="w-6 h-6" />
            </Button>
            
            <Button
              onClick={togglePlayPause}
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
            >
              {isPlaying ? (
                <Pause className="w-6 h-6" />
              ) : (
                <Play className="w-6 h-6" />
              )}
            </Button>
            
            <Button
              onClick={nextSlide}
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
            >
              <SkipForward className="w-6 h-6" />
            </Button>
            
            {!isFullscreen && (
              <Button
                onClick={toggleFullscreen}
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20 ml-4"
              >
                <Maximize className="w-6 h-6" />
              </Button>
            )}
          </div>
        </div>

        {/* Slide indicators */}
        <div className="absolute bottom-32 left-1/2 transform -translate-x-1/2">
          <div className="flex gap-2">
            {display.mediaItems?.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  setCurrentIndex(index);
                }}
                className={`w-3 h-3 rounded-full transition-all ${
                  index === currentIndex 
                    ? 'bg-white' 
                    : 'bg-white/40 hover:bg-white/60'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Keyboard shortcuts help */}
      {showControls && (
        <div className="absolute top-4 right-4 bg-black/70 rounded-lg p-3 text-xs">
          <div className="space-y-1 text-white/80">
            <div>Space: Play/Pause</div>
            <div>←→: Navigate</div>
            <div>F: Fullscreen</div>
            <div>R: Refresh</div>
            <div>Esc: Exit fullscreen</div>
          </div>
        </div>
      )}
    </div>
  );
} 