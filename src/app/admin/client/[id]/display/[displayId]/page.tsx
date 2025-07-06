'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Upload, Image, Video, Plus, X, Trash2, Edit, Save } from 'lucide-react';
import { Display, MediaItem } from '@/types';

export default function DisplayDetailPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const clientId = params.id as string;
  const displayId = params.displayId as string;
  
  const [display, setDisplay] = useState<Display | null>(null);
  const [allMedia, setAllMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    name: '',
    category: 'Store' as 'Promotion' | 'Head Office' | 'Store',
    duration: '5'
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [editingDuration, setEditingDuration] = useState<string | null>(null);
  const [newDuration, setNewDuration] = useState('');
  
  // Display edit state
  const [isEditingDisplay, setIsEditingDisplay] = useState(false);
  const [editDisplayForm, setEditDisplayForm] = useState({
    name: ''
  });
  const [updatingDisplay, setUpdatingDisplay] = useState(false);
  const [deletingDisplay, setDeletingDisplay] = useState(false);
  
  // Search state
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      router.push('/login');
      return;
    }

    fetchData();
  }, [user, displayId, router]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch display details with assigned media
      const displayResponse = await fetch(`/api/displays/${displayId}?clientId=${clientId}`);
      if (displayResponse.ok) {
        const displayData = await displayResponse.json();
        setDisplay(displayData);
      }

      // Fetch all available media
      const mediaResponse = await fetch('/api/media');
      if (mediaResponse.ok) {
        const mediaData = await mediaResponse.json();
        setAllMedia(mediaData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
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

  const handleAssignMedia = async (mediaId: string) => {
    try {
      const response = await fetch(`/api/displays/${displayId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientId,
          action: 'assign',
          mediaId,
        }),
      });

      if (response.ok) {
        await fetchData(); // Refresh data
      } else {
        console.error('Failed to assign media');
      }
    } catch (error) {
      console.error('Error assigning media:', error);
    }
  };

  const handleRemoveMedia = async (mediaId: string) => {
    try {
      const response = await fetch(`/api/displays/${displayId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientId,
          action: 'remove',
          mediaId,
        }),
      });

      if (response.ok) {
        await fetchData(); // Refresh data
      } else {
        console.error('Failed to remove media');
      }
    } catch (error) {
      console.error('Error removing media:', error);
    }
  };

  const handleUpdateMediaDuration = async (mediaId: string, duration: number) => {
    try {
      const response = await fetch(`/api/media/${mediaId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          duration: duration,
        }),
      });

      if (response.ok) {
        await fetchData(); // Refresh data
        setEditingDuration(null);
        setNewDuration('');
      } else {
        console.error('Failed to update media duration');
      }
    } catch (error) {
      console.error('Error updating media duration:', error);
    }
  };

  const startEditingDuration = (mediaId: string, currentDuration: number) => {
    setEditingDuration(mediaId);
    setNewDuration(currentDuration.toString());
  };

  const cancelEditingDuration = () => {
    setEditingDuration(null);
    setNewDuration('');
  };

  const saveDuration = (mediaId: string) => {
    const duration = parseInt(newDuration);
    if (duration > 0) {
      handleUpdateMediaDuration(mediaId, duration);
    }
  };

  // Display edit functions
  const handleEditDisplay = () => {
    if (display) {
      setEditDisplayForm({
        name: display.name
      });
      setIsEditingDisplay(true);
    }
  };

  const handleCancelEditDisplay = () => {
    setIsEditingDisplay(false);
    setEditDisplayForm({ name: '' });
    setError('');
  };

  const handleUpdateDisplay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editDisplayForm.name.trim()) {
      setError('Display name is required');
      return;
    }

    setUpdatingDisplay(true);
    setError('');

    try {
      const response = await fetch(`/api/displays/${displayId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientId,
          name: editDisplayForm.name.trim()
        })
      });

      if (response.ok) {
        const updatedDisplay = await response.json();
        setDisplay(updatedDisplay);
        setIsEditingDisplay(false);
        setEditDisplayForm({ name: '' });
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to update display');
      }
    } catch (error) {
      console.error('Error updating display:', error);
      setError('Failed to update display');
    } finally {
      setUpdatingDisplay(false);
    }
  };

  const handleDeleteDisplay = async () => {
    const confirmMessage = `Apakah Anda yakin ingin menghapus display "${display?.name}"?

⚠️ PERHATIAN: Ini akan menghapus:
• Display "${display?.name}"
• Semua media yang ter-assign ke display ini
• Data ini tidak dapat dikembalikan

Ketik "DELETE" untuk konfirmasi:`;

    const userInput = prompt(confirmMessage);
    if (userInput !== 'DELETE') {
      return;
    }

    setDeletingDisplay(true);
    setError('');

    try {
      const response = await fetch(`/api/displays/${displayId}?clientId=${clientId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Redirect back to client page
        router.push(`/admin/client/${clientId}`);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to delete display');
      }
    } catch (error) {
      console.error('Error deleting display:', error);
      setError('Failed to delete display');
    } finally {
      setDeletingDisplay(false);
    }
  };

  if (!user || user.role !== 'admin') {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading display details...</p>
        </div>
      </div>
    );
  }

  if (!display) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Display Not Found</h2>
          <p className="text-gray-600 mb-4">The requested display could not be found.</p>
          <Button onClick={() => router.push(`/admin/client/${clientId}`)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Client
          </Button>
        </div>
      </div>
    );
  }

  const assignedMediaIds = display.mediaItems?.map(media => media.id) || [];
  const availableMedia = allMedia
    .filter(media => !assignedMediaIds.includes(media.id))
    .filter(media => 
      searchTerm === '' || 
      media.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      media.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Head Office':
        return 'bg-blue-100 text-blue-800';
      case 'Store':
        return 'bg-green-100 text-green-800';
      case 'Promotion':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getMediaIcon = (type: string) => {
    if (type.startsWith('image/')) {
      return <Image className="w-4 h-4" />;
    } else if (type.startsWith('video/')) {
      return <Video className="w-4 h-4" />;
    }
    return <Image className="w-4 h-4" />;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Fixed Header */}
      <div className="sticky top-0 z-30 border-b bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4 mb-4">
            <Button
              onClick={() => router.push(`/admin/client/${clientId}`)}
              variant="ghost"
              size="sm"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Client
            </Button>
          </div>
          
          <div className="flex justify-between items-start">
            <div className="flex-1">
              {isEditingDisplay ? (
                <form onSubmit={handleUpdateDisplay} className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Input
                      value={editDisplayForm.name}
                      onChange={(e) => setEditDisplayForm({ name: e.target.value })}
                      placeholder="Display name"
                      className="text-2xl font-bold h-10 max-w-md"
                      required
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="submit"
                      size="sm"
                      disabled={updatingDisplay}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Save className="w-4 h-4 mr-1" />
                      {updatingDisplay ? 'Saving...' : 'Save'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleCancelEditDisplay}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              ) : (
                <div>
                  <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold">{display?.name}</h1>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleEditDisplay}
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDeleteDisplay}
                      disabled={deletingDisplay}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      {deletingDisplay ? 'Deleting...' : 'Delete'}
                    </Button>
                  </div>
                  <p className="text-gray-600">Manage media files for this display</p>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="text-sm text-gray-500">
                      {display?.mediaItems?.length || 0} media files assigned
                    </span>
                  </div>
                </div>
              )}
            </div>
            {!isEditingDisplay && (
              <Button onClick={() => setShowUploadForm(true)}>
                <Upload className="w-4 h-4 mr-2" />
                Upload Media
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="container mx-auto px-4 py-8">
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
                  <CardTitle>Upload New Media</CardTitle>
                  <CardDescription>Upload image or video files for digital signage</CardDescription>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => {
                    setShowUploadForm(false);
                    setUploadForm({ name: '', category: 'Store', duration: '5' });
                    setSelectedFile(null);
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
                  <Label htmlFor="mediaFile">Select File *</Label>
                  <Input
                    id="mediaFile"
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,video/mp4"
                    onChange={handleFileSelect}
                    required
                  />
                  <p className="text-xs text-gray-500">
                    Supported formats: JPG, PNG images (max 10MB) and MP4 videos (max 100MB)
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="mediaName">Media Name *</Label>
                    <Input
                      id="mediaName"
                      placeholder="Promo Summer Sale"
                      value={uploadForm.name}
                      onChange={(e) => setUploadForm(prev => ({ ...prev, name: e.target.value }))}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="mediaCategory">Category *</Label>
                    <Select 
                      value={uploadForm.category} 
                      onValueChange={(value) => setUploadForm(prev => ({ ...prev, category: value as any }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Store">Store</SelectItem>
                        <SelectItem value="Promotion">Promotion</SelectItem>
                        <SelectItem value="Head Office">Head Office</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="mediaDuration">Duration (seconds) *</Label>
                    <Input
                      id="mediaDuration"
                      type="number"
                      min="1"
                      max="60"
                      value={uploadForm.duration}
                      onChange={(e) => setUploadForm(prev => ({ ...prev, duration: e.target.value }))}
                      required
                    />
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button type="submit" disabled={uploading || !selectedFile}>
                    {uploading ? 'Uploading...' : 'Upload Media'}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => {
                      setShowUploadForm(false);
                      setUploadForm({ name: '', category: 'Store', duration: '5' });
                      setSelectedFile(null);
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

        {/* Assigned Media */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Assigned Media</h2>
          {display.mediaItems && display.mediaItems.length > 0 ? (
            <>
              {/* Table view for desktop */}
              <div className="hidden md:block">
                <div className="bg-white rounded-lg border overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Media</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Preview</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Category</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Duration</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {display.mediaItems.map((media, index) => (
                        <tr key={media.id} className={`border-t ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              {getMediaIcon(media.type)}
                              <div>
                                <div className="font-medium text-gray-900">{media.name}</div>
                                <div className="text-sm text-gray-500">{media.type.toUpperCase()}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="w-16 h-12 bg-gray-100 rounded overflow-hidden">
                              {media.type.startsWith('image/') ? (
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
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(media.category)}`}>
                              {media.category}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            {editingDuration === media.id ? (
                              <div className="flex items-center gap-2">
                                <Input
                                  type="number"
                                  min="1"
                                  max="300"
                                  value={newDuration}
                                  onChange={(e) => setNewDuration(e.target.value)}
                                  className="w-20 h-8"
                                />
                                <span className="text-sm">s</span>
                              </div>
                            ) : (
                              <button
                                onClick={() => startEditingDuration(media.id, media.duration)}
                                className="hover:text-blue-600 cursor-pointer flex items-center gap-1"
                                title="Click to edit duration"
                              >
                                {media.duration}s 
                                <Edit className="w-3 h-3 text-blue-500" />
                              </button>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex gap-2">
                              {editingDuration === media.id ? (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => saveDuration(media.id)}
                                    className="text-green-600 hover:text-green-700"
                                  >
                                    <Save className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={cancelEditingDuration}
                                  >
                                    <X className="w-4 h-4" />
                                  </Button>
                                </>
                              ) : (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-red-600 hover:text-red-700"
                                  onClick={() => handleRemoveMedia(media.id)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Card view for mobile */}
              <div className="md:hidden space-y-4">
                {display.mediaItems.map((media) => (
                  <Card key={media.id} className="relative">
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-2">
                        {getMediaIcon(media.type)}
                        <CardTitle className="text-base truncate">{media.name}</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="aspect-video bg-gray-100 rounded-md overflow-hidden">
                          {media.type.startsWith('image/') ? (
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
                        <div className="flex justify-between items-center text-xs text-gray-500 mb-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(media.category)}`}>
                            {media.category}
                          </span>
                          {editingDuration === media.id ? (
                            <div className="flex items-center gap-1">
                              <Input
                                type="number"
                                min="1"
                                max="300"
                                value={newDuration}
                                onChange={(e) => setNewDuration(e.target.value)}
                                className="w-16 h-6 text-xs"
                              />
                              <span className="text-xs">s</span>
                            </div>
                          ) : (
                            <button
                              onClick={() => startEditingDuration(media.id, media.duration)}
                              className="hover:text-blue-600 cursor-pointer flex items-center gap-1"
                              title="Click to edit duration"
                            >
                              {media.duration}s 
                              <Edit className="w-3 h-3 text-blue-500" />
                            </button>
                          )}
                        </div>
                        <div className="flex gap-2">
                          {editingDuration === media.id ? (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => saveDuration(media.id)}
                                className="flex-1 text-green-600 hover:text-green-700"
                              >
                                <Save className="w-4 h-4 mr-1" />
                                Save
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={cancelEditingDuration}
                                className="flex-1"
                              >
                                Cancel
                              </Button>
                            </>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full text-red-600 hover:text-red-700"
                              onClick={() => handleRemoveMedia(media.id)}
                            >
                              <Trash2 className="w-4 h-4 mr-1" />
                              Remove
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Image className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No Media Assigned</h3>
                <p className="text-gray-500 mb-4">
                  Upload or assign media files to this display to get started.
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Available Media */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Available Media</h2>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Input
                  placeholder="Search media by name or category..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-64"
                />
                {searchTerm && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                    onClick={() => setSearchTerm('')}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
          {searchTerm && (
            <p className="text-sm text-gray-600 mb-4">
              {availableMedia.length > 0 
                ? `Found ${availableMedia.length} media file${availableMedia.length === 1 ? '' : 's'} matching "${searchTerm}"`
                : `No media found matching "${searchTerm}"`
              }
            </p>
          )}
          {availableMedia.length > 0 ? (
            <>
              {/* Table view for desktop */}
              <div className="hidden md:block">
                <div className="bg-white rounded-lg border overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Name</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Media Category</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Duration</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {availableMedia.map((media, index) => (
                        <tr key={media.id} className={`border-t ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              {getMediaIcon(media.type)}
                              <div>
                                <div className="font-medium text-gray-900">{media.name}</div>
                                <div className="text-sm text-gray-500">{media.type.toUpperCase()}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(media.category)}`}>
                              {media.category}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-gray-900 font-medium">{media.duration}s</span>
                          </td>
                          <td className="py-3 px-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleAssignMedia(media.id)}
                              className="text-blue-600 hover:text-blue-700"
                            >
                              <Plus className="w-4 h-4 mr-1" />
                              Assign to Display
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Card view for mobile */}
              <div className="md:hidden space-y-4">
                {availableMedia.map((media) => (
                  <Card key={media.id}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-2">
                        {getMediaIcon(media.type)}
                        <CardTitle className="text-base truncate">{media.name}</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="aspect-video bg-gray-100 rounded-md overflow-hidden">
                          {media.type.startsWith('image/') ? (
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
                        <div className="flex justify-between text-xs text-gray-500">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(media.category)}`}>
                            {media.category}
                          </span>
                          <span>{media.duration}s</span>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => handleAssignMedia(media.id)}
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Assign to Display
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                {searchTerm ? (
                  <>
                    <Image className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Media Found</h3>
                    <p className="text-gray-500 mb-4">
                      No media files match your search for "{searchTerm}". Try a different search term.
                    </p>
                    <Button 
                      variant="outline" 
                      onClick={() => setSearchTerm('')}
                    >
                      Clear Search
                    </Button>
                  </>
                ) : (
                  <>
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Available Media</h3>
                    <p className="text-gray-500 mb-4">
                      All media files have been assigned to this display, or no media exists yet.
                    </p>
                    <Button onClick={() => setShowUploadForm(true)}>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload New Media
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
} 