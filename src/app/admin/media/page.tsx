'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Video, Upload, ArrowRight, Plus } from 'lucide-react';
import { MediaItem } from '@/types';

export default function MediaPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [mediaStats, setMediaStats] = useState({
    'Head Office': 0,
    'Store': 0,
    'Promotion': 0,
    total: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Wait for auth loading to complete
    if (authLoading) return;
    
    if (!user || user.role !== 'admin') {
      router.push('/login');
      return;
    }

    fetchMediaStats();
  }, [user, router, authLoading]);

  const fetchMediaStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/media');
      
      if (response.ok) {
        const mediaData: MediaItem[] = await response.json();
        const stats = {
          'Head Office': mediaData.filter(m => m.category === 'Head Office').length,
          'Store': mediaData.filter(m => m.category === 'Store').length,
          'Promotion': mediaData.filter(m => m.category === 'Promotion').length,
          total: mediaData.length
        };
        setMediaStats(stats);
      }
    } catch (error) {
      console.error('Error fetching media stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const mediaCategories = [
    {
      name: 'Head Office Media',
      description: 'Manage corporate and head office media files',
      icon: FileText,
      color: 'bg-blue-500',
      hoverColor: 'hover:bg-blue-600',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
      count: mediaStats['Head Office'],
      path: '/admin/media/head-office'
    },
    {
      name: 'Store Media',
      description: 'Manage store-specific media files and content',
      icon: Video,
      color: 'bg-green-500',
      hoverColor: 'hover:bg-green-600',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600',
      count: mediaStats['Store'],
      path: '/admin/media/store'
    },
    {
      name: 'Promotion Media',
      description: 'Manage promotional and marketing media files',
      icon: Upload,
      color: 'bg-purple-500',
      hoverColor: 'hover:bg-purple-600',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600',
      count: mediaStats['Promotion'],
      path: '/admin/media/promotion'
    }
  ];

  // Show loading while auth is loading
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Fixed Header */}
      <div className="sticky top-0 z-30 bg-white border-b shadow-sm">
        <div className="p-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">Media Management</h1>
              <p className="text-gray-600">Manage your digital signage media files by category</p>
              <div className="flex items-center gap-4 mt-2">
                <span className="text-sm text-gray-500">
                  {mediaStats.total} total files
                </span>
                <span className="text-sm text-gray-500">
                  Supported: MP4, JPG, PNG • Default: 60s
                </span>
              </div>
            </div>
            {loading && (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                <span className="text-sm text-gray-600">Loading stats...</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {mediaCategories.map((category) => {
            const IconComponent = category.icon;
            
            return (
              <Card 
                key={category.name} 
                className="cursor-pointer hover:shadow-lg transition-all duration-300 border-0 shadow-sm"
                onClick={() => router.push(category.path)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className={`p-3 rounded-lg ${category.bgColor}`}>
                      <IconComponent className={`w-6 h-6 ${category.textColor}`} />
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-900">
                        {category.count}
                      </div>
                      <div className="text-xs text-gray-500">files</div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardTitle className="text-lg mb-2">{category.name}</CardTitle>
                  <CardDescription className="text-gray-600 mb-4">
                    {category.description}
                  </CardDescription>
                  <Button 
                    className={`w-full ${category.color} ${category.hoverColor} text-white`}
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(category.path);
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Manage {category.name.split(' ')[0]}
                    <ArrowRight className="w-4 h-4 ml-auto" />
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Summary Stats */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Media Overview</CardTitle>
            <CardDescription>
              Summary of all media files across categories
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {mediaStats['Head Office']}
                </div>
                <div className="text-sm text-blue-600">Head Office</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {mediaStats['Store']}
                </div>
                <div className="text-sm text-green-600">Store</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {mediaStats['Promotion']}
                </div>
                <div className="text-sm text-purple-600">Promotion</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-600">
                  {mediaStats.total}
                </div>
                <div className="text-sm text-gray-600">Total Files</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
            <CardDescription>
              Common media management tasks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button 
                variant="outline" 
                className="h-auto p-4 flex flex-col items-center space-y-2"
                onClick={() => router.push('/admin/media/head-office')}
              >
                <FileText className="w-8 h-8 text-blue-500" />
                <span className="font-medium">Add Head Office Media</span>
                <span className="text-xs text-gray-500">Corporate content</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-auto p-4 flex flex-col items-center space-y-2"
                onClick={() => router.push('/admin/media/store')}
              >
                <Video className="w-8 h-8 text-green-500" />
                <span className="font-medium">Add Store Media</span>
                <span className="text-xs text-gray-500">Store-specific content</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-auto p-4 flex flex-col items-center space-y-2"
                onClick={() => router.push('/admin/media/promotion')}
              >
                <Upload className="w-8 h-8 text-purple-500" />
                <span className="font-medium">Add Promotion Media</span>
                <span className="text-xs text-gray-500">Marketing content</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 