'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Monitor, Plus, Settings, X, Edit, Trash2, Save } from 'lucide-react';
import { Client, Display } from '@/types';

export default function ClientDetailPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const clientId = params.id as string;
  
  const [client, setClient] = useState<Client | null>(null);
  const [displays, setDisplays] = useState<Display[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newDisplayName, setNewDisplayName] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    pin: ''
  });
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      router.push('/login');
      return;
    }

    fetchClientData();
  }, [user, clientId, router]);

  const fetchClientData = async () => {
    try {
      setLoading(true);
      
      // Fetch client details
      const clientResponse = await fetch(`/api/clients/${clientId}`);
      if (clientResponse.ok) {
        const clientData = await clientResponse.json();
        setClient(clientData);
      } else {
        setError('Failed to load client details');
        return;
      }

      // Fetch displays for this client
      const displaysResponse = await fetch(`/api/clients/${clientId}/displays`);
      if (displaysResponse.ok) {
        const displaysData = await displaysResponse.json();
        setDisplays(displaysData);
      } else {
        setError('Failed to load displays');
      }
    } catch (error) {
      console.error('Error fetching client data:', error);
      setError('Failed to load client data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDisplay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDisplayName.trim()) {
      setError('Display name is required');
      return;
    }

    setCreating(true);
    setError('');

    try {
      const response = await fetch('/api/displays', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newDisplayName,
          clientId: clientId
        })
      });

      if (response.ok) {
        setNewDisplayName('');
        setShowCreateForm(false);
        await fetchClientData();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to create display');
      }
    } catch (error) {
      console.error('Error creating display:', error);
      setError('Failed to create display');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteDisplay = async (displayId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus display ini?')) return;

    try {
      const response = await fetch(`/api/displays/${displayId}?clientId=${clientId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchClientData();
      } else {
        console.error('Failed to delete display');
      }
    } catch (error) {
      console.error('Error deleting display:', error);
    }
  };

  const handleDisplayClick = (displayId: string) => {
    router.push(`/admin/client/${clientId}/display/${displayId}`);
  };

  const handleEditClick = () => {
    if (client) {
      setEditForm({
        name: client.name,
        description: client.description,
        pin: client.pin
      });
      setIsEditing(true);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditForm({ name: '', description: '', pin: '' });
    setError('');
  };

  const handleUpdateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm.name.trim() || !editForm.description.trim() || !editForm.pin.trim()) {
      setError('All fields are required');
      return;
    }

    if (editForm.pin.length !== 6 || !/^\d+$/.test(editForm.pin)) {
      setError('PIN must be exactly 6 digits');
      return;
    }

    setUpdating(true);
    setError('');

    try {
      const response = await fetch(`/api/clients/${clientId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editForm.name.trim(),
          description: editForm.description.trim(),
          pin: editForm.pin.trim()
        })
      });

      if (response.ok) {
        const updatedClient = await response.json();
        setClient(updatedClient);
        setIsEditing(false);
        setEditForm({ name: '', description: '', pin: '' });
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to update client');
      }
    } catch (error) {
      console.error('Error updating client:', error);
      setError('Failed to update client');
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteClient = async () => {
    const confirmMessage = `Apakah Anda yakin ingin menghapus client "${client?.name}"?

⚠️ PERHATIAN: Ini akan menghapus:
• Client "${client?.name}"
• Semua ${displays.length} display yang terkait
• Semua media assignments dari display tersebut

Tindakan ini tidak dapat dibatalkan!`;

    if (!confirm(confirmMessage)) {
      return;
    }

    setDeleting(true);
    setError('');

    try {
      const response = await fetch(`/api/clients/${clientId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Show success message before redirecting
        alert(`Client "${client?.name}" dan semua data terkait berhasil dihapus.`);
        router.push('/admin');
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to delete client');
      }
    } catch (error) {
      console.error('Error deleting client:', error);
      setError('Failed to delete client');
    } finally {
      setDeleting(false);
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
          <p className="text-gray-600">Loading client details...</p>
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Client Not Found</h2>
          <p className="text-gray-600 mb-4">The requested client could not be found.</p>
          <Button onClick={() => router.push('/admin')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Admin
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b bg-white">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4 mb-4">
            <Button
              onClick={() => router.push('/admin')}
              variant="ghost"
              size="sm"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Admin
            </Button>
          </div>
          
          <div className="flex justify-between items-start">
            <div className="flex-1">
              {isEditing ? (
                <form onSubmit={handleUpdateClient} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="editName">Client Name *</Label>
                    <Input
                      id="editName"
                      value={editForm.name}
                      onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                      placeholder="Client Name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="editDescription">Description *</Label>
                    <Input
                      id="editDescription"
                      value={editForm.description}
                      onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                      placeholder="Client Description"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="editPin">PIN (6 digits) *</Label>
                    <Input
                      id="editPin"
                      value={editForm.pin}
                      onChange={(e) => setEditForm({...editForm, pin: e.target.value})}
                      placeholder="123456"
                      maxLength={6}
                      pattern="[0-9]{6}"
                      required
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" disabled={updating}>
                      <Save className="w-4 h-4 mr-2" />
                      {updating ? 'Updating...' : 'Update Client'}
                    </Button>
                    <Button type="button" variant="outline" onClick={handleCancelEdit}>
                      Cancel
                    </Button>
                  </div>
                </form>
              ) : (
                <div>
                  <h1 className="text-2xl font-bold">{client.name}</h1>
                  <p className="text-gray-600">{client.description}</p>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="text-sm text-gray-500">
                      PIN: <code className="bg-gray-100 px-2 py-1 rounded">{client.pin}</code>
                    </span>
                    <span className="text-sm text-gray-500">
                      {displays.length} display{displays.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="mt-2 p-2 bg-blue-50 rounded-md">
                    <p className="text-xs text-blue-700">
                      ℹ️ Semua display adalah bagian dari client ini. Menghapus client akan menghapus semua display yang terkait.
                    </p>
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-2 ml-4">
              {!isEditing && (
                <>
                  <Button variant="outline" onClick={handleEditClick}>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Client
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={handleDeleteClient}
                    disabled={deleting}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    {deleting ? 'Deleting...' : 'Delete Client'}
                  </Button>
                  <Button onClick={() => setShowCreateForm(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Display
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-md">
            {error}
          </div>
        )}

        {/* Create Display Form */}
        {showCreateForm && (
          <Card className="mb-8">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Add New Display</CardTitle>
                  <CardDescription>Create a new display for {client.name}</CardDescription>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => {
                    setShowCreateForm(false);
                    setNewDisplayName('');
                    setError('');
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateDisplay} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="displayName">Display Name *</Label>
                  <Input
                    id="displayName"
                    placeholder="Main Display"
                    value={newDisplayName}
                    onChange={(e) => setNewDisplayName(e.target.value)}
                    required
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={creating}>
                    {creating ? 'Creating...' : 'Create Display'}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => {
                      setShowCreateForm(false);
                      setNewDisplayName('');
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

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displays.map((display) => (
            <Card 
              key={display.id} 
              className="hover:shadow-lg transition-shadow cursor-pointer"
            >
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Monitor className="w-8 h-8 text-blue-600" />
                  <div>
                    <CardTitle className="text-lg">{display.name}</CardTitle>
                    <CardDescription>
                      {display.mediaItems?.length || 0} media files
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-sm text-gray-600">
                    <p>Status: <span className="text-green-600">Active</span></p>
                    <p>Last updated: Recently</p>
                  </div>
                  
                  <Button 
                    className="w-full"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDisplayClick(display.id);
                    }}
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Manage Display
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {displays.length === 0 && !loading && (
          <Card>
            <CardContent className="p-8 text-center">
              <Monitor className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Displays Found</h3>
              <p className="text-gray-500 mb-4">
                Create the first display for {client.name} to get started.
              </p>
              <Button onClick={() => setShowCreateForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add First Display
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
} 