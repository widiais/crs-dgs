'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Monitor, LogIn } from 'lucide-react';

export default function HomePage() {
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { loginStore } = useAuth();
  const router = useRouter();

  const handleStoreLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await loginStore(pin);
      router.push('/store');
    } catch (error) {
      setError('PIN tidak valid. Periksa kembali PIN Anda.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Monitor className="w-16 h-16 text-blue-600 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Digital Signage System
          </h1>
          <p className="text-gray-600">Sistem manajemen konten digital untuk Android TV</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LogIn className="w-5 h-5" />
              Store Login
            </CardTitle>
            <CardDescription>
              Masukkan PIN store untuk mengakses display
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleStoreLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="pin">PIN Store (6 digit)</Label>
                <Input
                  id="pin"
                  type="text"
                  placeholder="Masukkan PIN store"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength={6}
                  pattern="[0-9]{6}"
                  required
                  className="text-center text-2xl tracking-widest"
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Memverifikasi...' : 'Masuk ke Store'}
              </Button>
            </form>
            
            {error && (
              <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">
                {error}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="text-center mt-6 space-y-2">
          <p className="text-sm text-gray-500">
            Demo PIN: <code className="bg-gray-100 px-2 py-1 rounded">123456</code>
          </p>
          <div className="flex items-center justify-center gap-2">
            <span className="text-sm text-gray-500">Admin?</span>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => router.push('/login')}
              className="text-blue-600 hover:text-blue-700"
            >
              Login di sini
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 