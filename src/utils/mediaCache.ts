import { CachedMedia, MediaItem } from '@/types';

const DB_NAME = 'DigitalSignageCache';
const DB_VERSION = 1;
const STORE_NAME = 'media';
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days for Android TV
const MAX_CACHE_SIZE = 500 * 1024 * 1024; // 500MB max cache size

class MediaCacheManager {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('size', 'size', { unique: false });
        }
      };
    });
  }

  async cacheMedia(mediaItem: MediaItem): Promise<void> {
    if (!this.db) await this.init();

    try {
      // Check if already cached and still valid
      const cached = await this.getCachedMedia(mediaItem.id);
      if (cached && (Date.now() - cached.timestamp < CACHE_DURATION)) {
        return; // Already cached and valid
      }

      // Check cache size before adding new items
      await this.cleanupOldCache();

      // Fetch with better error handling and retry logic
      const blob = await this.fetchWithRetry(mediaItem.url, 3);

      const cachedMedia: CachedMedia = {
        id: mediaItem.id,
        blob,
        timestamp: Date.now(),
        url: mediaItem.url,
        size: blob.size
      };

      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      await new Promise<void>((resolve, reject) => {
        const request = store.put(cachedMedia);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Error caching media:', error);
      throw error; // Re-throw to handle in calling code
    }
  }

  async fetchWithRetry(url: string, maxRetries: number): Promise<Blob> {
    let lastError: Error;
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        const response = await fetch(url, {
          cache: 'no-cache', // Always fetch fresh for caching
          headers: {
            'Accept': 'image/*,video/*,*/*'
          }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        return await response.blob();
      } catch (error) {
        lastError = error as Error;
        console.warn(`Fetch attempt ${i + 1} failed for ${url}:`, error);
        
        if (i < maxRetries - 1) {
          // Wait before retry (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
        }
      }
    }
    
    throw lastError!;
  }

  async getCachedMedia(mediaId: string): Promise<CachedMedia | null> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(mediaId);

      request.onsuccess = () => {
        const result = request.result;
        if (result && (Date.now() - result.timestamp < CACHE_DURATION)) {
          resolve(result);
        } else {
          resolve(null);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getCachedMediaUrl(mediaId: string): Promise<string | null> {
    const cached = await this.getCachedMedia(mediaId);
    if (cached) {
      return URL.createObjectURL(cached.blob);
    }
    return null;
  }

  // Bulk cache multiple media items with progress tracking
  async cacheMediaBulk(
    mediaItems: MediaItem[], 
    onProgress?: (completed: number, total: number, currentItem: string) => void
  ): Promise<{ successful: string[], failed: string[] }> {
    const successful: string[] = [];
    const failed: string[] = [];
    
    for (let i = 0; i < mediaItems.length; i++) {
      const item = mediaItems[i];
      
      try {
        onProgress?.(i, mediaItems.length, item.name);
        await this.cacheMedia(item);
        successful.push(item.id);
      } catch (error) {
        console.error(`Failed to cache ${item.name}:`, error);
        failed.push(item.id);
      }
      
      onProgress?.(i + 1, mediaItems.length, item.name);
    }
    
    return { successful, failed };
  }

  // Clean up old cached items to manage storage
  async cleanupOldCache(): Promise<void> {
    if (!this.db) await this.init();

    const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('timestamp');
    
    // Get all cached items
    const allItems = await new Promise<CachedMedia[]>((resolve, reject) => {
      const request = index.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    // Calculate total cache size
    const totalSize = allItems.reduce((sum, item) => sum + (item.size || 0), 0);
    
    if (totalSize > MAX_CACHE_SIZE) {
      // Sort by timestamp (oldest first) and remove old items
      allItems.sort((a, b) => a.timestamp - b.timestamp);
      
      let sizeToRemove = totalSize - (MAX_CACHE_SIZE * 0.8); // Remove until 80% of max
      
      for (const item of allItems) {
        if (sizeToRemove <= 0) break;
        
        await new Promise<void>((resolve, reject) => {
          const deleteRequest = store.delete(item.id);
          deleteRequest.onsuccess = () => resolve();
          deleteRequest.onerror = () => reject(deleteRequest.error);
        });
        
        sizeToRemove -= (item.size || 0);
      }
    }

    // Also remove expired items
    const cutoffTime = Date.now() - CACHE_DURATION;
    const expiredItems = allItems.filter(item => item.timestamp < cutoffTime);
    
    for (const item of expiredItems) {
      await new Promise<void>((resolve, reject) => {
        const deleteRequest = store.delete(item.id);
        deleteRequest.onsuccess = () => resolve();
        deleteRequest.onerror = () => reject(deleteRequest.error);
      });
    }
  }

  // Get cache statistics
  async getCacheStats(): Promise<{
    totalItems: number;
    totalSize: number;
    oldestItem: Date | null;
    newestItem: Date | null;
  }> {
    if (!this.db) await this.init();

    const transaction = this.db!.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    
    const allItems = await new Promise<CachedMedia[]>((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    const totalSize = allItems.reduce((sum, item) => sum + (item.size || 0), 0);
    const timestamps = allItems.map(item => item.timestamp);
    
    return {
      totalItems: allItems.length,
      totalSize,
      oldestItem: timestamps.length > 0 ? new Date(Math.min(...timestamps)) : null,
      newestItem: timestamps.length > 0 ? new Date(Math.max(...timestamps)) : null,
    };
  }

  // Clear all cache
  async clearCache(): Promise<void> {
    if (!this.db) await this.init();

    const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    await new Promise<void>((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Check if media exists in cache
  async isMediaCached(mediaId: string): Promise<boolean> {
    const cached = await this.getCachedMedia(mediaId);
    return cached !== null;
  }
}

export const mediaCacheManager = new MediaCacheManager(); 