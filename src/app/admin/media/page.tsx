'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Upload, Image, Video, X, Trash2, Plus, Eye, ChevronLeft, ChevronRight, Edit2, Check, FileText } from 'lucide-react';
import { MediaItem } from '@/types';

export default function MediaSetupPage() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [allMedia, setAllMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState<{[key: string]: boolean}>({});
  const [previewMedia, setPreviewMedia] = useState<MediaItem | null>(null);
  const [editingMedia, setEditingMedia] = useState<{[key: string]: {name: string, duration: string}}>({});
  const [dragOver, setDragOver] = useState<{[key: string]: boolean}>({});
  const [pagination, setPagination] = useState<{[key: string]: number}>({
    'Head Office': 0,
    'Store': 0,
    'Promotion': 0
  });

  const ITEMS_PER_PAGE = 8;
  const categories = ['Head Office', 'Store', 'Promotion'];

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
        setAllMedia(mediaData);
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

  const handleDragOver = useCallback((e: React.DragEvent, category: string) => {
    e.preventDefault();
    setDragOver(prev => ({ ...prev, [category]: true }));
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent, category: string) => {
    e.preventDefault();
    setDragOver(prev => ({ ...prev, [category]: false }));
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent, category: string) => {
    e.preventDefault();
    setDragOver(prev => ({ ...prev, [category]: false }));
    
    const files = Array.from(e.dataTransfer.files);
    
    for (const file of files) {
      await uploadFile(file, category);
    }
  }, []);

  const uploadFile = async (file: File, category: string) => {
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
        setAllMedia(prev => [...prev, newMedia]);
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
    setEditingMedia(prev => ({
      ...prev,
      [media.id]: {
        name: media.name,
        duration: media.duration.toString()
      }
    }));
  };

  const handleEditCancel = (mediaId: string) => {
    setEditingMedia(prev => {
      const newEditing = { ...prev };
      delete newEditing[mediaId];
      return newEditing;
    });
  };

  const handleEditSave = async (mediaId: string) => {
    const editData = editingMedia[mediaId];
    if (!editData || !editData.name.trim()) {
      setError('Media name is required');
      return;
    }

    const duration = parseInt(editData.duration);
    if (isNaN(duration) || duration < 1 || duration > 300) {
      setError('Duration must be between 1 and 300 seconds');
      return;
    }

    try {
      const response = await fetch(`/api/media/${mediaId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: editData.name.trim(),
          duration: duration
        })
      });

      if (response.ok) {
        const updatedMedia = await response.json();
        setAllMedia(prev => prev.map(m => m.id === mediaId ? updatedMedia : m));
        handleEditCancel(mediaId);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to update media');
      }
    } catch (error) {
      console.error('Error updating media:', error);
      setError('Failed to update media');
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
        setAllMedia(prev => prev.filter(m => m.id !== mediaId));
      } else {
        setError('Failed to delete media');
      }
    } catch (error) {
      console.error('Error deleting media:', error);
      setError('Failed to delete media');
    }
  };

  const handlePageChange = (category: string, direction: 'next' | 'prev') => {
    setPagination(prev => {
      const currentPage = prev[category] || 0;
      const newPage = direction === 'next' ? currentPage + 1 : currentPage - 1;
      return { ...prev, [category]: Math.max(0, newPage) };
    });
  };

  const getPaginatedMedia = (media: MediaItem[], category: string) => {
    const currentPage = pagination[category] || 0;
    const startIndex = currentPage * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return media.slice(startIndex, endIndex);
  };

  const getTotalPages = (media: MediaItem[]) => {
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

  const categorizedMedia = {
    'Head Office': allMedia.filter(m => m.category === 'Head Office'),
    'Store': allMedia.filter(m => m.category === 'Store'),
    'Promotion': allMedia.filter(m => m.category === 'Promotion')
  };

  const isUploading = Object.keys(uploading).length > 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Fixed Header */}
      <div className="sticky top-0 z-30 bg-white border-b shadow-sm">
        <div className="p-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">Media Management</h1>
              <p className="text-gray-600">Drag and drop MP4, JPG, and PNG files or click to upload</p>
              <div className="flex items-center gap-4 mt-2">
                <span className="text-sm text-gray-500">
                  {allMedia.length} total media files
                </span>
                <span className="text-sm text-gray-500">
                  Supported formats: MP4, JPG, PNG • Default duration: 60s
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

        {/* Media Categories */}
        <div className="space-y-8">
          {categories.map((category) => {
            const media = categorizedMedia[category as keyof typeof categorizedMedia];
            const currentPage = pagination[category] || 0;
            const totalPages = getTotalPages(media);
            const paginatedMedia = getPaginatedMedia(media, category);

            return (
              <div key={category} className="bg-white rounded-lg border p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">{category} Media</h2>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <span>{media.length} items</span>
                    {totalPages > 1 && (
                      <span>• Page {currentPage + 1} of {totalPages}</span>
                    )}
                  </div>
                </div>

                {/* Drag and Drop Area */}
                <div
                  className={`border-2 border-dashed rounded-lg p-6 mb-6 transition-all ${
                    dragOver[category]
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  onDragOver={(e) => handleDragOver(e, category)}
                  onDragLeave={(e) => handleDragLeave(e, category)}
                  onDrop={(e) => handleDrop(e, category)}
                >
                  <div className="text-center">
                    <FileText className={`w-12 h-12 mx-auto mb-4 ${
                      dragOver[category] ? 'text-blue-500' : 'text-gray-400'
                    }`} />
                    <h3 className="text-lg font-medium mb-2">
                      {dragOver[category] ? `Drop files for ${category}` : `Upload ${category} Media`}
                    </h3>
                    <p className="text-gray-500 mb-4">
                      Drag and drop MP4, JPG, or PNG files here, or click to browse
                    </p>
                    <p className="text-sm text-gray-400 mb-4">
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
                          files.forEach(file => uploadFile(file, category));
                        };
                        input.click();
                      }}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Browse Files
                    </Button>
                  </div>
                </div>

                {media.length > 0 ? (
                  <>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3 mb-4">
                      {paginatedMedia.map((item) => {
                        const isEditing = editingMedia[item.id];
                        
                        return (
                          <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                            <div className="aspect-square bg-gray-100 relative group">
                              {item.type.startsWith('image/') ? (
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
                              <div className="absolute top-1 left-1">
                                {item.type.startsWith('image/') ? (
                                  <div className="bg-blue-500 text-white px-1.5 py-0.5 rounded text-xs flex items-center gap-1">
                                    <Image className="w-2 h-2" />
                                    IMG
                                  </div>
                                ) : (
                                  <div className="bg-green-500 text-white px-1.5 py-0.5 rounded text-xs flex items-center gap-1">
                                    <Video className="w-2 h-2" />
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
                            
                            <CardContent className="p-2">
                              {isEditing ? (
                                <div className="space-y-2">
                                  <Input
                                    value={isEditing.name}
                                    onChange={(e) => setEditingMedia(prev => ({
                                      ...prev,
                                      [item.id]: { ...isEditing, name: e.target.value }
                                    }))}
                                    className="text-xs h-6"
                                    placeholder="Media name"
                                  />
                                  <div className="flex gap-1">
                                    <Input
                                      type="number"
                                      value={isEditing.duration}
                                      onChange={(e) => setEditingMedia(prev => ({
                                        ...prev,
                                        [item.id]: { ...isEditing, duration: e.target.value }
                                      }))}
                                      className="text-xs h-6 flex-1"
                                      placeholder="Duration"
                                      min="1"
                                      max="300"
                                    />
                                    <span className="text-xs text-gray-500 self-center">s</span>
                                  </div>
                                  <div className="flex gap-1">
                                    <Button
                                      size="sm"
                                      onClick={() => handleEditSave(item.id)}
                                      className="h-6 px-2 text-xs flex-1"
                                    >
                                      <Check className="w-3 h-3" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleEditCancel(item.id)}
                                      className="h-6 px-2 text-xs flex-1"
                                    >
                                      <X className="w-3 h-3" />
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <h4 className="font-medium text-xs truncate" title={item.name}>
                                    {item.name}
                                  </h4>
                                  <p className="text-xs text-gray-500">{item.duration}s</p>
                                </>
                              )}
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="flex justify-center items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(category, 'prev')}
                          disabled={currentPage === 0}
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <span className="text-sm text-gray-600">
                          {currentPage + 1} / {totalPages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(category, 'next')}
                          disabled={currentPage >= totalPages - 1}
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-gray-400 mb-4">
                      {category === 'Head Office' && <Image className="w-12 h-12 mx-auto" />}
                      {category === 'Store' && <Video className="w-12 h-12 mx-auto" />}
                      {category === 'Promotion' && <Upload className="w-12 h-12 mx-auto" />}
                    </div>
                    <h3 className="text-lg font-medium mb-2">No {category} Media</h3>
                    <p className="text-gray-500">
                      Drag and drop files above or click Browse Files to get started.
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {allMedia.length === 0 && !loading && (
          <Card>
            <CardContent className="p-8 text-center">
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Media Files</h3>
              <p className="text-gray-500 mb-4">
                Start by uploading your first media file using drag and drop or click to browse.
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
                  {previewMedia.category} • {previewMedia.duration}s • {previewMedia.type.split('/')[1].toUpperCase()}
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
              {previewMedia.type.startsWith('image/') ? (
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
    </div>
  );
} 