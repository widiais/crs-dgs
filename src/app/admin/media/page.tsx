'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Upload, Image, Video, X, Trash2, Plus, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import { MediaItem } from '@/types';

export default function MediaSetupPage() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [allMedia, setAllMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    name: '',
    category: 'Store',
    duration: '5'
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewMedia, setPreviewMedia] = useState<MediaItem | null>(null);
  const [pagination, setPagination] = useState<{[key: string]: number}>({
    'Head Office': 0,
    'Store': 0,
    'Promotion': 0
  });

  const ITEMS_PER_PAGE = 8;

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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'video/mp4'];
      if (!allowedTypes.includes(file.type)) {
        setError('Only JPG, PNG, and MP4 files are allowed');
        return;
      }
      
      setSelectedFile(file);
      // Auto-fill name from filename
      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
      setUploadForm(prev => ({ ...prev, name: nameWithoutExt }));
    }
  };

  const handleUploadMedia = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !uploadForm.name.trim()) {
      setError('File and name are required');
      return;
    }

    setUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('name', uploadForm.name);
      formData.append('category', uploadForm.category);
      formData.append('duration', uploadForm.duration);

      const response = await fetch('/api/media/upload', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const newMedia = await response.json();
        setAllMedia(prev => [...prev, newMedia]);
        
        // Reset form
        setUploadForm({ name: '', category: 'Store', duration: '5' });
        setSelectedFile(null);
        setShowUploadForm(false);
        
        // Reset file input
        const fileInput = document.getElementById('mediaFile') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to upload media');
      }
    } catch (error) {
      console.error('Error uploading media:', error);
      setError('Failed to upload media');
    } finally {
      setUploading(false);
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Fixed Header */}
      <div className="sticky top-0 z-30 bg-white border-b shadow-sm">
        <div className="p-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">Media Management</h1>
              <p className="text-gray-600">Upload and manage MP4, JPG, and PNG files for digital signage</p>
              <div className="flex items-center gap-4 mt-2">
                <span className="text-sm text-gray-500">
                  {allMedia.length} total media files
                </span>
                <span className="text-sm text-gray-500">
                  Supported formats: MP4, JPG, PNG
                </span>
              </div>
            </div>
            <Button onClick={() => setShowUploadForm(true)}>
              <Upload className="w-4 h-4 mr-2" />
              Upload Media
            </Button>
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="p-6">
        {error && (
          <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-md">
            {error}
          </div>
        )}

        {/* Upload Media Form */}
        {showUploadForm && (
          <Card className="mb-8">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Upload Media</CardTitle>
                  <CardDescription>Upload MP4 videos or JPG/PNG images for digital signage</CardDescription>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => {
                    setShowUploadForm(false);
                    setSelectedFile(null);
                    setUploadForm({ name: '', category: 'Store', duration: '5' });
                    setError('');
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUploadMedia} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="mediaFile">Media File *</Label>
                  <Input
                    id="mediaFile"
                    type="file"
                    accept=".mp4,.jpg,.jpeg,.png"
                    onChange={handleFileSelect}
                    required
                  />
                  <p className="text-xs text-gray-500">
                    Supported formats: MP4 (video), JPG, PNG (images). Max size: 100MB
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="mediaName">Media Name *</Label>
                    <Input
                      id="mediaName"
                      placeholder="Enter media name"
                      value={uploadForm.name}
                      onChange={(e) => setUploadForm(prev => ({ ...prev, name: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="mediaCategory">Category *</Label>
                    <select
                      id="mediaCategory"
                      value={uploadForm.category}
                      onChange={(e) => setUploadForm(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Store">Store</option>
                      <option value="Head Office">Head Office</option>
                      <option value="Promotion">Promotion</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="mediaDuration">Duration (seconds) *</Label>
                    <Input
                      id="mediaDuration"
                      type="number"
                      min="1"
                      max="60"
                      placeholder="5"
                      value={uploadForm.duration}
                      onChange={(e) => setUploadForm(prev => ({ ...prev, duration: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button type="submit" disabled={uploading}>
                    {uploading ? 'Uploading...' : 'Upload Media'}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => {
                      setShowUploadForm(false);
                      setSelectedFile(null);
                      setUploadForm({ name: '', category: 'Store', duration: '5' });
                      setError('');
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Media Categories */}
        <div className="space-y-8">
          {Object.entries(categorizedMedia).map(([category, media]) => {
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

                {media.length > 0 ? (
                  <>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3 mb-4">
                      {paginatedMedia.map((item) => (
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
                                variant="destructive"
                                onClick={() => handleDeleteMedia(item.id)}
                                className="h-8 w-8 p-0"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                          
                          <CardContent className="p-2">
                            <h4 className="font-medium text-xs truncate" title={item.name}>
                              {item.name}
                            </h4>
                            <p className="text-xs text-gray-500">{item.duration}s</p>
                          </CardContent>
                        </Card>
                      ))}
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
                  <Card>
                    <CardContent className="p-8 text-center">
                      <div className="text-gray-400 mb-4">
                        {category === 'Head Office' && <Image className="w-12 h-12 mx-auto" />}
                        {category === 'Store' && <Video className="w-12 h-12 mx-auto" />}
                        {category === 'Promotion' && <Upload className="w-12 h-12 mx-auto" />}
                      </div>
                      <h3 className="text-lg font-medium mb-2">No {category} Media</h3>
                      <p className="text-gray-500 mb-4">
                        Upload MP4, JPG, or PNG files for this category.
                      </p>
                      <Button onClick={() => setShowUploadForm(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Upload {category} Media
                      </Button>
                    </CardContent>
                  </Card>
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
                Start by uploading your first media file. Supported formats: MP4, JPG, PNG.
              </p>
              <Button onClick={() => setShowUploadForm(true)}>
                <Upload className="w-4 h-4 mr-2" />
                Upload Your First Media
              </Button>
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