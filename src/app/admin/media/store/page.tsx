'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, Image, Video, X, Trash2, Eye, ChevronLeft, ChevronRight, Edit2, FileText, ArrowLeft } from 'lucide-react';
import { MediaItem } from '@/types';
import { MediaEditDialog } from '@/components/MediaEditDialog';

export default function StoreMediaPage() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState<{[key: string]: boolean}>({});
  const [previewMedia, setPreviewMedia] = useState<MediaItem | null>(null);
  const [editingMedia, setEditingMedia] = useState<MediaItem | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);

  const ITEMS_PER_PAGE = 12;
  const category = 'Store';

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      router.push('/login');
      return;
    }

    fetchMedia();
  }, [user, router]);

  const fetchMedia = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/media');
      
      if (response.ok) {
        const mediaData = await response.json();
        setMedia(mediaData.filter((m: MediaItem) => m.category === category));
      } else {
        setError('Failed to load media');
      }
    } catch (error) {
      console.error('Error fetching media:', error);
      setError('Failed to load media');
    } finally {
      setLoading(false);
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    
    for (const file of files) {
      await uploadFile(file);
    }
  }, []);

  const uploadFile = async (file: File) => {
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'video/mp4'];
    if (!allowedTypes.includes(file.type)) {
      setError(`File ${file.name}: Only JPG, PNG, and MP4 files are allowed`);
      return;
    }

    // Validate file size (100MB)
    if (file.size > 100 * 1024 * 1024) {
      setError(`File ${file.name}: File size must be less than 100MB`);
      return;
    }

    const uploadId = `${category}-${Date.now()}-${Math.random()}`;
    setUploading(prev => ({ ...prev, [uploadId]: true }));
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('name', file.name.replace(/\.[^/.]+$/, "")); // Remove extension
      formData.append('category', category);
      formData.append('duration', '60'); // Default 60 seconds

      const response = await fetch('/api/media/upload', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const newMedia = await response.json();
        setMedia(prev => [...prev, newMedia]);
      } else {
        const errorData = await response.json();
        setError(`Failed to upload ${file.name}: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error uploading media:', error);
      setError(`Failed to upload ${file.name}`);
    } finally {
      setUploading(prev => {
        const newUploading = { ...prev };
        delete newUploading[uploadId];
        return newUploading;
      });
    }
  };

  const handleEditStart = (media: MediaItem) => {
    setEditingMedia(media);
  };

  const handleEditSave = async (mediaId: string, name: string, duration: number) => {
    setEditLoading(true);
    try {
      const response = await fetch(`/api/media/${mediaId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: name,
          duration: duration
        })
      });

      if (response.ok) {
        const updatedMedia = await response.json();
        setMedia(prev => prev.map(m => m.id === mediaId ? updatedMedia : m));
        setEditingMedia(null);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to update media');
        throw new Error(errorData.error || 'Failed to update media');
      }
    } catch (error) {
      console.error('Error updating media:', error);
      setError('Failed to update media');
      throw error;
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteMedia = async (mediaId: string) => {
    if (!confirm('Are you sure you want to delete this media? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/media/${mediaId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setMedia(prev => prev.filter(m => m.id !== mediaId));
      } else {
        setError('Failed to delete media');
      }
    } catch (error) {
      console.error('Error deleting media:', error);
      setError('Failed to delete media');
    }
  };

  const handlePageChange = (direction: 'next' | 'prev') => {
    setCurrentPage(prev => {
      const newPage = direction === 'next' ? prev + 1 : prev - 1;
      return Math.max(0, newPage);
    });
  };

  const getPaginatedMedia = () => {
    const startIndex = currentPage * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return media.slice(startIndex, endIndex);
  };

  const getTotalPages = () => {
    return Math.ceil(media.length / ITEMS_PER_PAGE);
  };

  if (!user || user.role !== 'admin') {
    return null;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading media...</p>
        </div>
      </div>
    );
  }

  const totalPages = getTotalPages();
  const paginatedMedia = getPaginatedMedia();
  const isUploading = Object.keys(uploading).length > 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Fixed Header */}
      <div className="sticky top-0 z-30 bg-white border-b shadow-sm">
        <div className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <Button
              onClick={() => router.push('/admin/media')}
              variant="ghost"
              size="sm"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Media
            </Button>
          </div>
          
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">Store Media</h1>
              <p className="text-gray-600">Manage Store media files with drag and drop</p>
              <div className="flex items-center gap-4 mt-2">
                <span className="text-sm text-gray-500">
                  {media.length} total files
                </span>
                <span className="text-sm text-gray-500">
                  Supported: MP4, JPG, PNG • Default: 60s
                </span>
              </div>
            </div>
            {isUploading && (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                <span className="text-sm text-gray-600">Uploading...</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="p-6">
        {error && (
          <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-md flex justify-between items-center">
            <span>{error}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setError('')}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* Drag and Drop Area */}
        <div
          className={`border-2 border-dashed rounded-lg p-8 mb-6 transition-all ${
            dragOver
              ? 'border-green-500 bg-green-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="text-center">
            <Video className={`w-16 h-16 mx-auto mb-4 ${
              dragOver ? 'text-green-500' : 'text-gray-400'
            }`} />
            <h3 className="text-xl font-medium mb-2">
              {dragOver ? 'Drop Store files here' : 'Upload Store Media'}
            </h3>
            <p className="text-gray-500 mb-4">
              Drag and drop MP4, JPG, or PNG files here, or click to browse
            </p>
            <p className="text-sm text-gray-400 mb-6">
              Default duration: 60 seconds • Max file size: 100MB
            </p>
            <Button
              variant="outline"
              onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = '.mp4,.jpg,.jpeg,.png';
                input.multiple = true;
                input.onchange = (e) => {
                  const files = Array.from((e.target as HTMLInputElement).files || []);
                  files.forEach(file => uploadFile(file));
                };
                input.click();
              }}
            >
              <Upload className="w-4 h-4 mr-2" />
              Browse Files
            </Button>
          </div>
        </div>

        {/* Media Grid */}
        {media.length > 0 ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 mb-6">
              {paginatedMedia.map((item) => {
                return (
                  <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="aspect-square bg-gray-100 relative group">
                      {item.type.startsWith('image') ? (
                        <img 
                          src={item.url} 
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <video 
                          src={item.url}
                          className="w-full h-full object-cover"
                          muted
                          preload="metadata"
                        />
                      )}
                      
                      {/* Type Badge */}
                      <div className="absolute top-2 left-2">
                        {item.type.startsWith('image') ? (
                          <div className="bg-blue-500 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                            <Image className="w-3 h-3" />
                            IMG
                          </div>
                        ) : (
                          <div className="bg-green-500 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                            <Video className="w-3 h-3" />
                            MP4
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setPreviewMedia(item)}
                          className="h-8 w-8 p-0 bg-white hover:bg-gray-100"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditStart(item)}
                          className="h-8 w-8 p-0 bg-white hover:bg-gray-100"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteMedia(item.id)}
                          className="h-8 w-8 p-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <CardContent className="p-3">
                      <h4 className="font-medium text-sm truncate" title={item.name}>
                        {item.name}
                      </h4>
                      <p className="text-xs text-gray-500">{item.duration}s</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-4">
                <Button
                  variant="outline"
                  onClick={() => handlePageChange('prev')}
                  disabled={currentPage === 0}
                >
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Previous
                </Button>
                <span className="text-sm text-gray-600">
                  Page {currentPage + 1} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  onClick={() => handlePageChange('next')}
                  disabled={currentPage >= totalPages - 1}
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            )}
          </>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <Video className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-medium mb-2">No Store Media</h3>
              <p className="text-gray-500 mb-4">
                Start by uploading your first Store media file using drag and drop or click to browse.
              </p>
              <p className="text-sm text-gray-400">
                Supported formats: MP4, JPG, PNG • Default duration: 60 seconds
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Preview Modal */}
      {previewMedia && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] w-full overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold">{previewMedia.name}</h3>
                <p className="text-sm text-gray-500">
                  Store • {previewMedia.duration}s • {previewMedia.type.toUpperCase()}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPreviewMedia(null)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="p-4 flex items-center justify-center bg-gray-50">
              {previewMedia.type.startsWith('image') ? (
                <img 
                  src={previewMedia.url} 
                  alt={previewMedia.name}
                  className="max-w-full max-h-[60vh] object-contain"
                />
              ) : (
                <video 
                  src={previewMedia.url}
                  className="max-w-full max-h-[60vh] object-contain"
                  controls
                  preload="metadata"
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Media Dialog */}
      <MediaEditDialog
        media={editingMedia}
        isOpen={!!editingMedia}
        onClose={() => setEditingMedia(null)}
        onSave={handleEditSave}
        isLoading={editLoading}
      />
    </div>
  );
} 