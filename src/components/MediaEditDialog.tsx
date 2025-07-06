import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { MediaItem } from '@/types';

interface MediaEditDialogProps {
  media: MediaItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (mediaId: string, name: string, duration: number) => Promise<void>;
  isLoading?: boolean;
}

export function MediaEditDialog({ 
  media, 
  isOpen, 
  onClose, 
  onSave, 
  isLoading = false 
}: MediaEditDialogProps) {
  const [name, setName] = useState('');
  const [duration, setDuration] = useState('');
  const [errors, setErrors] = useState<{ name?: string; duration?: string }>({});

  useEffect(() => {
    if (media) {
      setName(media.name);
      setDuration(media.duration.toString());
      setErrors({});
    }
  }, [media]);

  const handleClose = () => {
    setErrors({});
    onClose();
  };

  const validateForm = () => {
    const newErrors: { name?: string; duration?: string } = {};

    if (!name.trim()) {
      newErrors.name = 'Media name is required';
    } else if (name.trim().length < 2) {
      newErrors.name = 'Media name must be at least 2 characters';
    } else if (name.trim().length > 100) {
      newErrors.name = 'Media name must be less than 100 characters';
    }

    const durationNum = parseInt(duration);
    if (!duration || isNaN(durationNum)) {
      newErrors.duration = 'Duration is required';
    } else if (durationNum < 1) {
      newErrors.duration = 'Duration must be at least 1 second';
    } else if (durationNum > 300) {
      newErrors.duration = 'Duration cannot exceed 300 seconds (5 minutes)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!media || !validateForm()) return;

    try {
      await onSave(media.id, name.trim(), parseInt(duration));
      handleClose();
    } catch (error) {
      console.error('Error saving media:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    }
  };

  if (!media) return null;

  return (
    <Dialog
      open={isOpen}
      onClose={handleClose}
      title="Edit Media"
      description="Update the media name and duration"
      maxWidth="md"
    >
      <DialogContent>
        <div className="space-y-6">
          {/* Media Preview */}
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
              {media.type.startsWith('image') ? (
                <img 
                  src={media.url} 
                  alt={media.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <video 
                  src={media.url}
                  className="w-full h-full object-cover"
                  muted
                  preload="metadata"
                />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className={`
                  px-2 py-1 rounded text-xs font-medium
                  ${media.type.startsWith('image') 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'bg-green-100 text-green-700'
                  }
                `}>
                  {media.type.startsWith('image') ? 'Image' : 'Video'}
                </span>
                <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium">
                  {media.category}
                </span>
              </div>
              <p className="text-sm text-gray-600 truncate">
                Original: {media.name}
              </p>
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="media-name" className="text-sm font-medium text-gray-700">
                Media Name
              </Label>
              <Input
                id="media-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyPress={handleKeyPress}
                className={`mt-1 ${errors.name ? 'border-red-500' : ''}`}
                placeholder="Enter media name"
                disabled={isLoading}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            <div>
              <Label htmlFor="media-duration" className="text-sm font-medium text-gray-700">
                Duration (seconds)
              </Label>
              <div className="mt-1 relative">
                <Input
                  id="media-duration"
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className={`pr-12 ${errors.duration ? 'border-red-500' : ''}`}
                  placeholder="60"
                  min="1"
                  max="300"
                  disabled={isLoading}
                />
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500">
                  sec
                </span>
              </div>
              {errors.duration && (
                <p className="mt-1 text-sm text-red-600">{errors.duration}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Duration range: 1-300 seconds (5 minutes maximum)
              </p>
            </div>
          </div>

          {/* Duration Helper */}
          <div className="p-3 bg-blue-50 rounded-lg">
            <h4 className="text-sm font-medium text-blue-900 mb-2">Duration Guidelines</h4>
            <div className="text-xs text-blue-800 space-y-1">
              <div>• <strong>Images:</strong> 5-15 seconds (recommended: 10s)</div>
              <div>• <strong>Videos:</strong> Use actual video duration</div>
              <div>• <strong>Promotions:</strong> 10-30 seconds for impact</div>
              <div>• <strong>Announcements:</strong> 15-60 seconds</div>
            </div>
          </div>
        </div>
      </DialogContent>

      <DialogFooter>
        <Button
          variant="outline"
          onClick={handleClose}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          disabled={isLoading}
          className="min-w-[80px]"
        >
          {isLoading ? 'Saving...' : 'Save Changes'}
        </Button>
      </DialogFooter>
    </Dialog>
  );
} 