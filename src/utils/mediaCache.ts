import { CachedMedia, MediaItem } from '@/types';

const DB_NAME = 'DigitalSignageCache';
const DB_VERSION = 1;
const STORE_NAME = 'media';
const CACHE_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days for Android TV (longer caching)
const MAX_CACHE_SIZE = 2 * 1024 * 1024 * 1024; // 2GB max cache size for Android TV

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

  // Android TV specific: Pre-cache all display media for offline playback
  async preCacheDisplayMedia(
    mediaItems: MediaItem[],
    onProgress?: (completed: number, total: number, currentItem: string, status: 'downloading' | 'complete' | 'error') => void
  ): Promise<{ 
    totalCached: number, 
    alreadyCached: number, 
    failed: number,
    cacheSize: number 
  }> {
    if (!this.db) await this.init();

    let totalCached = 0;
    let alreadyCached = 0;
    let failed = 0;
    let cacheSize = 0;

    for (let i = 0; i < mediaItems.length; i++) {
      const item = mediaItems[i];
      
      try {
        onProgress?.(i, mediaItems.length, item.name, 'downloading');
        
        // Check if already cached
        const existing = await this.getCachedMedia(item.id);
        if (existing) {
          alreadyCached++;
          cacheSize += existing.size || 0;
          onProgress?.(i + 1, mediaItems.length, item.name, 'complete');
          continue;
        }

        // Cache the media
        await this.cacheMedia(item);
        totalCached++;
        
        // Get cached size
        const cached = await this.getCachedMedia(item.id);
        if (cached) {
          cacheSize += cached.size || 0;
        }
        
        onProgress?.(i + 1, mediaItems.length, item.name, 'complete');
        
      } catch (error) {
        console.error(`Failed to cache ${item.name}:`, error);
        failed++;
        onProgress?.(i + 1, mediaItems.length, item.name, 'error');
      }
    }

    return { totalCached, alreadyCached, failed, cacheSize };
  }

  // Background sync - update cache when online
  async backgroundSync(mediaItems: MediaItem[]): Promise<void> {
    if (!navigator.onLine) return;

    const outdatedItems: MediaItem[] = [];
    
    // Check which items need updating
    for (const item of mediaItems) {
      const cached = await this.getCachedMedia(item.id);
      if (!cached || (Date.now() - cached.timestamp > CACHE_DURATION / 2)) {
        outdatedItems.push(item);
      }
    }

    if (outdatedItems.length > 0) {
      console.log(`Background sync: updating ${outdatedItems.length} media items`);
      
      // Update in background without blocking UI
      this.cacheMediaBulk(outdatedItems, (completed, total, currentItem) => {
        console.log(`Background sync: ${completed}/${total} - ${currentItem}`);
      }).catch(error => {
        console.warn('Background sync failed:', error);
      });
    }
  }

  // Force refresh all media (manual sync)
  async forceSyncAllMedia(
    mediaItems: MediaItem[],
    onProgress?: (completed: number, total: number, currentItem: string) => void
  ): Promise<void> {
    // Clear existing cache for these items
    for (const item of mediaItems) {
      try {
        if (!this.db) await this.init();
        const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        await new Promise<void>((resolve, reject) => {
          const request = store.delete(item.id);
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        });
      } catch (error) {
        console.warn(`Failed to clear cache for ${item.id}:`, error);
      }
    }

    // Re-cache all items
    await this.cacheMediaBulk(mediaItems, onProgress);
  }

  // Get storage usage info for Android TV
  async getStorageInfo(): Promise<{
    usedBytes: number;
    availableBytes: number;
    usedMB: number;
    availableMB: number;
    usagePercent: number;
  }> {
    try {
      // Try to get storage quota (Android TV support)
      const estimate = await (navigator.storage?.estimate?.() || Promise.resolve({ usage: 0, quota: MAX_CACHE_SIZE }));
      
      const usedBytes = estimate.usage || 0;
      const availableBytes = (estimate.quota || MAX_CACHE_SIZE) - usedBytes;
      
      return {
        usedBytes,
        availableBytes,
        usedMB: Math.round(usedBytes / (1024 * 1024)),
        availableMB: Math.round(availableBytes / (1024 * 1024)),
        usagePercent: Math.round((usedBytes / (estimate.quota || MAX_CACHE_SIZE)) * 100)
      };
    } catch (error) {
      console.warn('Storage estimation not supported:', error);
      const stats = await this.getCacheStats();
      return {
        usedBytes: stats.totalSize,
        availableBytes: MAX_CACHE_SIZE - stats.totalSize,
        usedMB: Math.round(stats.totalSize / (1024 * 1024)),
        availableMB: Math.round((MAX_CACHE_SIZE - stats.totalSize) / (1024 * 1024)),
        usagePercent: Math.round((stats.totalSize / MAX_CACHE_SIZE) * 100)
      };
    }
  }
}

export const mediaCacheManager = new MediaCacheManager(); 