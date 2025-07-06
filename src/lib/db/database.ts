import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Client, Display, MediaItem } from '@/types';

// Simple file-based database using localStorage for persistence
// In production, this would be replaced with a real database

interface Database {
  clients: Client[];
  displays: Display[];
  media: MediaItem[];
}

class FirestoreDatabase {
  // Main Collections
  private clientsCollection = collection(db, 'clients');
  private mediaCollection = collection(db, 'media');

  // Helper method to get displays subcollection for a client
  private getDisplaysCollection(clientId: string) {
    return collection(db, 'clients', clientId, 'displays');
  }

  // Helper method to get media assignments subcollection for a display
  private getDisplayMediaCollection(clientId: string, displayId: string) {
    return collection(db, 'clients', clientId, 'displays', displayId, 'assignedMedia');
  }

  // Client methods
  async getClients(): Promise<Client[]> {
    try {
      const querySnapshot = await getDocs(query(this.clientsCollection, orderBy('name')));
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Client));
    } catch (error) {
      console.error('Error fetching clients:', error);
      return [];
    }
  }

  async getClientById(id: string): Promise<Client | null> {
    try {
      const docRef = doc(this.clientsCollection, id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data()
        } as Client;
      }
      return null;
    } catch (error) {
      console.error('Error fetching client:', error);
      return null;
    }
  }

  async getClientByPin(pin: string): Promise<Client | null> {
    try {
      const q = query(this.clientsCollection, where('pin', '==', pin));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        return {
          id: doc.id,
          ...doc.data()
        } as Client;
      }
      return null;
    } catch (error) {
      console.error('Error fetching client by PIN:', error);
      return null;
    }
  }

  async createClient(client: Omit<Client, 'id'>): Promise<Client> {
    try {
      const docRef = await addDoc(this.clientsCollection, {
        ...client,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      return {
        id: docRef.id,
        ...client
      };
    } catch (error) {
      console.error('Error creating client:', error);
      throw error;
    }
  }

  async updateClient(id: string, updates: Partial<Client>): Promise<Client | null> {
    try {
      const docRef = doc(this.clientsCollection, id);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
      
      return await this.getClientById(id);
    } catch (error) {
      console.error('Error updating client:', error);
      return null;
    }
  }

  async deleteClient(id: string): Promise<boolean> {
    try {
      // Delete all displays and their media assignments
      const displaysCollection = this.getDisplaysCollection(id);
      const displaysSnapshot = await getDocs(displaysCollection);
      
      for (const displayDoc of displaysSnapshot.docs) {
        // Delete media assignments for this display
        const mediaAssignments = this.getDisplayMediaCollection(id, displayDoc.id);
        const mediaSnapshot = await getDocs(mediaAssignments);
        
        for (const mediaDoc of mediaSnapshot.docs) {
          await deleteDoc(mediaDoc.ref);
        }
        
        // Delete display
        await deleteDoc(displayDoc.ref);
      }
      
      // Delete client
      await deleteDoc(doc(this.clientsCollection, id));
      return true;
    } catch (error) {
      console.error('Error deleting client:', error);
      return false;
    }
  }

  // Display methods (using sub-collections)
  async getDisplaysByClientId(clientId: string): Promise<Display[]> {
    try {
      const displaysCollection = this.getDisplaysCollection(clientId);
      const querySnapshot = await getDocs(query(displaysCollection, orderBy('name')));
      
      const displays = await Promise.all(
        querySnapshot.docs.map(async (displayDoc) => {
          const displayData = {
            id: displayDoc.id,
            clientId,
            ...displayDoc.data()
          } as Display;

          // Get assigned media for this display
          const assignedMedia = await this.getDisplayAssignedMedia(clientId, displayDoc.id);
          displayData.mediaItems = assignedMedia;

          return displayData;
        })
      );

      return displays;
    } catch (error) {
      console.error('Error fetching displays by client:', error);
      return [];
    }
  }

  async getDisplayById(clientId: string, displayId: string): Promise<Display | null> {
    try {
      const displaysCollection = this.getDisplaysCollection(clientId);
      const docRef = doc(displaysCollection, displayId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const displayData = {
          id: docSnap.id,
          clientId,
          ...docSnap.data()
        } as Display;

        // Get assigned media for this display
        const assignedMedia = await this.getDisplayAssignedMedia(clientId, displayId);
        displayData.mediaItems = assignedMedia;

        return displayData;
      }
      return null;
    } catch (error) {
      console.error('Error fetching display:', error);
      return null;
    }
  }

  // New method to find display across all clients (for backward compatibility)
  async findDisplayById(displayId: string): Promise<{ display: Display; clientId: string } | null> {
    try {
      const clients = await this.getClients();
      
      for (const client of clients) {
        const display = await this.getDisplayById(client.id, displayId);
        if (display) {
          return { display, clientId: client.id };
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error finding display:', error);
      return null;
    }
  }

  async createDisplay(display: Omit<Display, 'id'>): Promise<Display> {
    try {
      const displaysCollection = this.getDisplaysCollection(display.clientId);
      const docRef = await addDoc(displaysCollection, {
        name: display.name,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      return {
        id: docRef.id,
        ...display,
        mediaItems: []
      };
    } catch (error) {
      console.error('Error creating display:', error);
      throw error;
    }
  }

  async updateDisplay(clientId: string, displayId: string, updates: Partial<Display>): Promise<Display | null> {
    try {
      const displaysCollection = this.getDisplaysCollection(clientId);
      const docRef = doc(displaysCollection, displayId);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
      
      return await this.getDisplayById(clientId, displayId);
    } catch (error) {
      console.error('Error updating display:', error);
      return null;
    }
  }

  async deleteDisplay(clientId: string, displayId: string): Promise<boolean> {
    try {
      // Delete all media assignments for this display
      const mediaAssignments = this.getDisplayMediaCollection(clientId, displayId);
      const mediaSnapshot = await getDocs(mediaAssignments);
      
      for (const mediaDoc of mediaSnapshot.docs) {
        await deleteDoc(mediaDoc.ref);
      }
      
      // Delete display
      const displaysCollection = this.getDisplaysCollection(clientId);
      await deleteDoc(doc(displaysCollection, displayId));
      return true;
    } catch (error) {
      console.error('Error deleting display:', error);
      return false;
    }
  }

  // Media assignment methods (using sub-collections)
  async assignMediaToDisplay(clientId: string, displayId: string, mediaId: string): Promise<boolean> {
    try {
      const mediaAssignments = this.getDisplayMediaCollection(clientId, displayId);
      
      // Check if media is already assigned
      const existingQuery = query(mediaAssignments, where('mediaId', '==', mediaId));
      const existingSnapshot = await getDocs(existingQuery);
      
      if (!existingSnapshot.empty) {
        return true; // Already assigned
      }
      
      // Add media assignment
      await addDoc(mediaAssignments, {
        mediaId,
        assignedAt: serverTimestamp()
      });
      
      return true;
    } catch (error) {
      console.error('Error assigning media to display:', error);
      return false;
    }
  }

  async removeMediaFromDisplay(clientId: string, displayId: string, mediaId: string): Promise<boolean> {
    try {
      const mediaAssignments = this.getDisplayMediaCollection(clientId, displayId);
      const q = query(mediaAssignments, where('mediaId', '==', mediaId));
      const querySnapshot = await getDocs(q);
      
      for (const docSnap of querySnapshot.docs) {
        await deleteDoc(docSnap.ref);
      }
      
      return true;
    } catch (error) {
      console.error('Error removing media from display:', error);
      return false;
    }
  }

  async getDisplayAssignedMedia(clientId: string, displayId: string): Promise<MediaItem[]> {
    try {
      const mediaAssignments = this.getDisplayMediaCollection(clientId, displayId);
      const assignmentsSnapshot = await getDocs(mediaAssignments);
      
      const mediaItems: MediaItem[] = [];
      
      for (const assignmentDoc of assignmentsSnapshot.docs) {
        const assignment = assignmentDoc.data();
        const media = await this.getMediaById(assignment.mediaId);
        if (media) {
          mediaItems.push(media);
        }
      }
      
      return mediaItems;
    } catch (error) {
      console.error('Error fetching assigned media:', error);
      return [];
    }
  }

  // Media methods (main collection)
  async getMedia(): Promise<MediaItem[]> {
    try {
      const querySnapshot = await getDocs(query(this.mediaCollection, orderBy('name')));
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as MediaItem));
    } catch (error) {
      console.error('Error fetching media:', error);
      return [];
    }
  }

  async getMediaById(id: string): Promise<MediaItem | null> {
    try {
      const docRef = doc(this.mediaCollection, id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data()
        } as MediaItem;
      }
      return null;
    } catch (error) {
      console.error('Error fetching media:', error);
      return null;
    }
  }

  async createMedia(media: Omit<MediaItem, 'id'>): Promise<MediaItem> {
    try {
      const docRef = await addDoc(this.mediaCollection, {
        ...media,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      return {
        id: docRef.id,
        ...media
      };
    } catch (error) {
      console.error('Error creating media:', error);
      throw error;
    }
  }

  async updateMedia(id: string, updates: Partial<MediaItem>): Promise<MediaItem | null> {
    try {
      const docRef = doc(this.mediaCollection, id);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
      
      return await this.getMediaById(id);
    } catch (error) {
      console.error('Error updating media:', error);
      return null;
    }
  }

  async deleteMedia(id: string): Promise<boolean> {
    try {
      // Remove media assignments from all displays first
      const clients = await this.getClients();
      
      for (const client of clients) {
        const displays = await this.getDisplaysByClientId(client.id);
        
        for (const display of displays) {
          await this.removeMediaFromDisplay(client.id, display.id, id);
        }
      }
      
      // Delete the media itself
      await deleteDoc(doc(this.mediaCollection, id));
      return true;
    } catch (error) {
      console.error('Error deleting media:', error);
      return false;
    }
  }

  // Backward compatibility method for existing API endpoints
  async getDisplayWithMedia(displayId: string): Promise<(Display & { mediaItems: MediaItem[] }) | null> {
    try {
      const result = await this.findDisplayById(displayId);
      if (!result) return null;
      
      return {
        ...result.display,
        mediaItems: result.display.mediaItems || []
      };
    } catch (error) {
      console.error('Error fetching display with media:', error);
      return null;
    }
  }
}

export const database = new FirestoreDatabase(); 