export interface Client {
  id: string;
  name: string;
  description: string;
  pin: string; // 6-digit PIN
}

export interface MediaItem {
  id: string;
  name: string;
  url: string;
  type: 'image' | 'video';
  category: 'Promotion' | 'Head Office' | 'Store';
  duration: number; // in seconds
}

export interface Display {
  id: string;
  clientId: string;
  name: string;
  mediaItems?: MediaItem[];
}

export interface User {
  uid: string;
  email?: string;
  role: 'admin' | 'store';
  clientId?: string;
}

export interface CachedMedia {
  id: string;
  blob: Blob;
  timestamp: number;
  url: string;
} 