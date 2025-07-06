'use client';

import { useAuth } from '@/contexts/AuthContext';
import { ReactNode } from 'react';

interface LoadingWrapperProps {
  children: ReactNode;
}

export function LoadingWrapper({ children }: LoadingWrapperProps) {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
} 