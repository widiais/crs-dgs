'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Plus, Image, Play, Upload, Trash2, Edit } from 'lucide-react';

// Mock data
const mockClients = [
  { id: '1', name: 'Store Jakarta', description: 'Toko utama Jakarta', pin: '123456' },
  { id: '2', name: 'Store Bandung', description: 'Cabang Bandung', pin: '654321' },
  { id: '3', name: 'Store Surabaya', description: 'Cabang Surabaya', pin: '789012' },
];

const mockDisplays = [
  { id: '1', clientId: '1', name: 'Display Utama', description: 'Main entrance display', mediaCount: 3, status: 'active' },
  { id: '2', clientId: '1', name: 'Display Promo', description: 'Promotional content display', mediaCount: 2, status: 'active' },
  { id: '3', clientId: '2', name: 'Display Entrance', description: 'Welcome display', mediaCount: 1, status: 'inactive' },
  { id: '4', clientId: '3', name: 'Display Main', description: 'Main display screen', mediaCount: 4, status: 'active' },
];

const mockMedia = [
  { id: '1', displayId: '1', name: 'Promo Ramadan', url: 'https://picsum.photos/800/600?random=1', type: 'image', category: 'Promotion', duration: 5, size: '2.5 MB', order: 1 },
  { id: '2', displayId: '1', name: 'Store Info', url: 'https://picsum.photos/800/600?random=2', type: 'image', category: 'Head Office', duration: 7, size: '1.8 MB', order: 2 },
  { id: '3', displayId: '1', name: 'Product Showcase', url: 'https://picsum.photos/800/600?random=3', type: 'image', category: 'Store', duration: 6, size: '3.2 MB', order: 3 },
  { id: '4', displayId: '2', name: 'Special Offer', url: 'https://picsum.photos/800/600?random=4', type: 'image', category: 'Promotion', duration: 8, size: '2.1 MB', order: 1 },
  { id: '5', displayId: '2', name: 'New Collection', url: 'https://picsum.photos/800/600?random=5', type: 'image', category: 'Store', duration: 5, size: '2.8 MB', order: 2 },
];

export default function DisplayDetailPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const displayId = params.id as string;
  
  const [display, setDisplay] = useState(null);
  const [client, setClient] = useState(null);
  const [mediaItems, setMediaItems] = useState([]);

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      router.push('/login');
      return;
    }

    // Find display
    const foundDisplay = mockDisplays.find(d => d.id === displayId);
    if (!foundDisplay) {
      router.push('/admin');
      return;
    }

    setDisplay(foundDisplay);
    
    // Find client for this display
    const foundClient = mockClients.find(c => c.id === foundDisplay.clientId);
    setClient(foundClient);
    
    // Get media for this display
    const displayMedia = mockMedia.filter(m => m.displayId === displayId);
    setMediaItems(displayMedia.sort((a, b) => a.order - b.order));
  }, [user, displayId, router]);

  const handleDeleteMedia = (mediaId: string) => {
    setMediaItems(mediaItems.filter(m => m.id !== mediaId));
  };

  const handlePreviewSlideshow = () => {
    router.push(`/store/display/${displayId}`);
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Head Office': return 'bg-blue-100 text-blue-800';
      case 'Store': return 'bg-green-100 text-green-800';
      case 'Promotion': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!user || user.role !== 'admin' || !display || !client) {
    return null;
  }

  const totalDuration = mediaItems.reduce((sum, item) => sum + item.duration, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b bg-white">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                onClick={() => router.push(`/admin/client/${client.id}`)}
                variant="outline"
                size="sm"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to {client.name}
              </Button>
              <div>
                <h1 className="text-2xl font-bold">{display.name}</h1>
                <p className="text-gray-600">{display.description}</p>
              </div>
            </div>
            <Button onClick={handlePreviewSlideshow} className="bg-green-600 hover:bg-green-700">
              <Play className="w-4 h-4 mr-2" />
              Preview Slideshow
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Display Info */}
        <div className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Display Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div>
                  <p className="text-sm font-medium text-gray-600">Display Name</p>
                  <p className="text-lg font-semibold">{display.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Client</p>
                  <p className="text-lg">{client.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Status</p>
                  <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                    display.status === 'active' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {display.status}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Duration</p>
                  <p className="text-lg font-semibold">{totalDuration}s</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Add Media Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Manage Media</CardTitle>
            <CardDescription>Upload and organize media files for {display.name}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button className="flex-1">
                <Upload className="w-4 h-4 mr-2" />
                Upload New Media
              </Button>
              <Button variant="outline" className="flex-1">
                <Plus className="w-4 h-4 mr-2" />
                Add from Library
              </Button>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Supported formats: JPG, PNG, MP4, WebM • Max size: 50MB
            </p>
          </CardContent>
        </Card>

        {/* Media List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Media Files ({mediaItems.length})</h3>
            <div className="text-sm text-gray-500">
              Drag to reorder • Total: {totalDuration}s
            </div>
          </div>
          
          {mediaItems.length > 0 ? (
            <div className="space-y-4">
              {mediaItems.map((media, index) => (
                <Card key={media.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-6">
                      {/* Order Number */}
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold">
                        {index + 1}
                      </div>

                      {/* Media Preview */}
                      <div className="flex-shrink-0">
                        <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden">
                          {media.type === 'image' ? (
                            <img 
                              src={media.url} 
                              alt={media.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Play className="w-8 h-8 text-gray-400" />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Media Info */}
                      <div className="flex-grow">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-semibold text-lg">{media.name}</h4>
                            <div className="flex items-center gap-4 mt-1">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(media.category)}`}>
                                {media.category}
                              </span>
                              <span className="text-sm text-gray-500">
                                {media.type.toUpperCase()} • {media.size}
                              </span>
                              <span className="text-sm text-gray-500">
                                {media.duration}s duration
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm">
                              <Edit className="w-4 h-4 mr-1" />
                              Edit
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="text-red-600 hover:text-red-700"
                              onClick={() => handleDeleteMedia(media.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Image className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No Media Files</h3>
                <p className="text-gray-500 mb-4">
                  Upload your first media file to start building your slideshow for {display.name}.
                </p>
                <Button>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload First Media
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Quick Stats */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Media</p>
                  <p className="text-2xl font-bold">{mediaItems.length}</p>
                </div>
                <Image className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Images</p>
                  <p className="text-2xl font-bold">
                    {mediaItems.filter(m => m.type === 'image').length}
                  </p>
                </div>
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 font-bold">I</span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Videos</p>
                  <p className="text-2xl font-bold">
                    {mediaItems.filter(m => m.type === 'video').length}
                  </p>
                </div>
                <Play className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Loop Time</p>
                  <p className="text-2xl font-bold">{Math.ceil(totalDuration / 60)}m</p>
                </div>
                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                  <span className="text-orange-600 font-bold">⏱</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 