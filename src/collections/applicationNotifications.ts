import { db } from '../firebase';
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  Timestamp,
  onSnapshot,
} from 'firebase/firestore';

export interface ApplicationNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'promo' | 'system';
  priority: number;
  isActive: boolean;
  isVisible: boolean;
  displayOrder: number;
  target: 'all' | 'finished_kyc' | 'not_verified' | 'active_users';
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

class ApplicationNotificationsCollection {
  private collectionName = 'applicationNotifications';

  async getAllActive(userTarget: string = 'all'): Promise<ApplicationNotification[]> {
    try {
      console.log('Fetching notifications from collection:', this.collectionName);

      // First, let's get all active notifications without complex ordering
      const q = query(
        collection(db, this.collectionName),
        where('isActive', '==', true)
      );

      console.log('Executing query for active notifications...');
      const querySnapshot = await getDocs(q);
      console.log('Query executed, found', querySnapshot.size, 'documents');

      const notifications: ApplicationNotification[] = [];

      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        console.log('Processing document:', docSnap.id, data);

        const notification: ApplicationNotification = {
          id: docSnap.id,
          title: data.title,
          message: data.message,
          type: data.type,
          priority: data.priority || 1,
          isActive: data.isActive || true,
          isVisible: data.isVisible || true,
          displayOrder: data.displayOrder || 0,
          target: data.target || 'all',
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          createdBy: data.createdBy || 'admin',
        };

        // Filter by target audience
        if (notification.target === 'all' ||
            notification.target === userTarget) {
          notifications.push(notification);
        }
      });

      // Sort manually since complex queries might fail
      notifications.sort((a, b) => {
        if (a.priority !== b.priority) {
          return b.priority - a.priority; // Higher priority first
        }
        return a.displayOrder - b.displayOrder; // Then by display order
      });

      console.log('Returning filtered notifications:', notifications.length, notifications);
      return notifications;
    } catch (error: any) {
      console.error('Error fetching application notifications:', error);
      console.error('Error details:', error.message);
      return [];
    }
  }

  async create(notification: Omit<ApplicationNotification, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const docData = {
        ...notification,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      const docRef = await addDoc(collection(db, this.collectionName), docData);
      return docRef.id;
    } catch (error) {
      console.error('Error creating application notification:', error);
      throw error;
    }
  }

  async update(id: string, updates: Partial<ApplicationNotification>): Promise<void> {
    try {
      const docRef = doc(db, this.collectionName, id);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error updating application notification:', error);
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const docRef = doc(db, this.collectionName, id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting application notification:', error);
      throw error;
    }
  }

  async getAllForAdmin(): Promise<ApplicationNotification[]> {
    try {
      console.log('Fetching all notifications for admin from collection:', this.collectionName);

      // Try with ordering first
      const q = query(
        collection(db, this.collectionName),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      console.log('Admin query found', querySnapshot.size, 'total documents');

      const notifications: ApplicationNotification[] = [];

      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        console.log('Admin processing document:', docSnap.id, {
          title: data.title,
          isActive: data.isActive,
          priority: data.priority
        });

        notifications.push({
          id: docSnap.id,
          title: data.title,
          message: data.message,
          type: data.type,
          priority: data.priority || 1,
          isActive: data.isActive || false,
          isVisible: data.isVisible || false,
          displayOrder: data.displayOrder || 0,
          target: data.target || 'all',
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          createdBy: data.createdBy || 'admin',
        });
      });

      return notifications;
    } catch (error: any) {
      console.error('Error fetching all notifications for admin:', error);
      console.error('Error details:', error.message);
      return [];
    }
  }

  // Debug method to get all documents without any query constraints
  async getAllRaw(): Promise<any[]> {
    try {
      console.log('Fetching all raw documents from collection:', this.collectionName);
      const querySnapshot = await getDocs(collection(db, this.collectionName));
      const allDocs: any[] = [];

      querySnapshot.forEach((docSnap) => {
        console.log('Raw document:', docSnap.id, docSnap.data());
        allDocs.push({
          id: docSnap.id,
          ...docSnap.data()
        });
      });

      console.log('Total raw documents found:', allDocs.length);
      return allDocs;
    } catch (error: any) {
      console.error('Error fetching raw documents:', error);
      return [];
    }
  }
}

export const applicationNotificationsCollection = new ApplicationNotificationsCollection();
