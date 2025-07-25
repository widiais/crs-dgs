'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Plus, Users, Monitor, ChevronRight, Image, X } from 'lucide-react';
import { Client } from '@/types';

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newClient, setNewClient] = useState({ 
    name: '', 
    description: '',
    pin: '' 
  });

  useEffect(() => {
    // Wait for auth loading to complete
    if (authLoading) return;
    
    if (!user || user.role !== 'admin') {
      router.push('/login');
      return;
    }

    fetchClients();
  }, [user, router, authLoading]);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/clients');
      
      if (response.ok) {
        const clientsData = await response.json();
        setClients(clientsData);
      } else {
        setError('Failed to load clients');
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
      setError('Failed to load clients');
    } finally {
      setLoading(false);
    }
  };

  const generateRandomPin = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClient.name.trim()) {
      setError('Client name is required');
      return;
    }

    if (!newClient.pin.trim()) {
      setError('PIN is required');
      return;
    }

    if (newClient.pin.length !== 6 || !/^\d+$/.test(newClient.pin)) {
      setError('PIN must be exactly 6 digits');
      return;
    }

    // Check if PIN already exists
    const existingClient = clients.find(client => client.pin === newClient.pin);
    if (existingClient) {
      setError('PIN already exists. Please use a different PIN.');
      return;
    }

    setCreating(true);
    setError('');

    try {
      const response = await fetch('/api/clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newClient)
      });

      if (response.ok) {
        const createdClient = await response.json();
        setClients(prev => [...prev, createdClient]);
        setNewClient({ name: '', description: '', pin: '' });
        setShowCreateForm(false);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to create client');
      }
    } catch (error) {
      console.error('Error creating client:', error);
      setError('Failed to create client');
    } finally {
      setCreating(false);
    }
  };

  const handleClientClick = (clientId: string) => {
    router.push(`/admin/client/${clientId}`);
  };

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading clients...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            <p className="text-gray-600">Digital Signage Management</p>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={() => router.push('/admin/media')}
              variant="outline"
            >
              <Image className="w-4 h-4 mr-2" />
              Media Setup
            </Button>
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add New Client
            </Button>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">Clients Overview</h2>
          <p className="text-gray-600">Manage stores and their digital displays</p>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}

      {/* Create Client Form */}
      {showCreateForm && (
        <Card className="mb-8">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Add New Client</CardTitle>
                <CardDescription>Create a new client/store with a unique PIN</CardDescription>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => {
                  setShowCreateForm(false);
                  setNewClient({ name: '', description: '', pin: '' });
                  setError('');
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateClient} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="clientName">Client Name *</Label>
                  <Input
                    id="clientName"
                    placeholder="Store Jakarta"
                    value={newClient.name}
                    onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clientDesc">Description *</Label>
                  <Input
                    id="clientDesc"
                    placeholder="Main store in Jakarta"
                    value={newClient.description}
                    onChange={(e) => setNewClient({ ...newClient, description: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="clientPin">PIN (6 digits) *</Label>
                <div className="flex gap-2">
                  <Input
                    id="clientPin"
                    placeholder="123456"
                    value={newClient.pin}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setNewClient({ ...newClient, pin: value });
                    }}
                    maxLength={6}
                    pattern="[0-9]{6}"
                    required
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setNewClient({ ...newClient, pin: generateRandomPin() })}
                  >
                    Generate
                  </Button>
                </div>
                <p className="text-xs text-gray-500">
                  6-digit PIN for store access. Must be unique.
                </p>
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={creating}>
                  {creating ? 'Creating...' : 'Create Client'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => {
                    setShowCreateForm(false);
                    setNewClient({ name: '', description: '', pin: '' });
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

      {/* Stats Cards */}
      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clients.length}</div>
            <p className="text-xs text-muted-foreground">Active stores</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Displays</CardTitle>
            <Monitor className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4</div>
            <p className="text-xs text-muted-foreground">Active displays</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Media Files</CardTitle>
            <Image className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5</div>
            <p className="text-xs text-muted-foreground">Total media items</p>
          </CardContent>
        </Card>
      </div>

      {/* Clients Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {clients.map((client) => (
          <Card 
            key={client.id} 
            className="hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => handleClientClick(client.id)}
          >
            <CardHeader>
              <div className="flex items-center gap-3">
                <Users className="w-8 h-8 text-blue-600" />
                <div>
                  <CardTitle className="text-lg">{client.name}</CardTitle>
                  <CardDescription>{client.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">PIN:</span>
                  <code className="bg-gray-100 px-2 py-1 rounded">{client.pin}</code>
                </div>
                
                <div className="pt-2 border-t">
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>Displays</span>
                    <span>2 active</span>
                  </div>
                </div>
                
                <Button 
                  className="w-full"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClientClick(client.id);
                  }}
                >
                  Manage Client
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
} 