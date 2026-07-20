import { db } from '../firebase';
import { collection, doc, setDoc, getDoc, updateDoc, query, where, getDocs, orderBy, limit } from 'firebase/firestore';

export interface WhatsAppSession {
  id: string;
  userId: string;
  sessionId: string;
  phoneNumber: string;
  isActive: boolean;
  qrCode?: string;
  authState?: any;
  lastActivity: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class WhatsAppSessionCollection {
  private collectionName = 'whatsapp_sessions';

  // Create a new WhatsApp session
  async create(sessionData: Omit<WhatsAppSession, 'id' | 'createdAt' | 'updatedAt'>): Promise<WhatsAppSession> {
    const sessionRef = doc(collection(db, this.collectionName));
    const now = new Date();

    const session: WhatsAppSession = {
      ...sessionData,
      id: sessionRef.id,
      createdAt: now,
      updatedAt: now,
    };

    await setDoc(sessionRef, {
      ...session,
      createdAt: session.createdAt.toISOString(),
      updatedAt: session.updatedAt.toISOString(),
      lastActivity: session.lastActivity.toISOString(),
    });

    return session;
  }

  // Get session by ID
  async getById(id: string): Promise<WhatsAppSession | null> {
    const sessionRef = doc(db, this.collectionName, id);
    const sessionSnap = await getDoc(sessionRef);

    if (sessionSnap.exists()) {
      const data = sessionSnap.data();
      return {
        ...data,
        id: sessionSnap.id,
        createdAt: new Date(data.createdAt),
        updatedAt: new Date(data.updatedAt),
        lastActivity: new Date(data.lastActivity),
      } as WhatsAppSession;
    }

    return null;
  }

  // Get session by user ID
  async getByUserId(userId: string): Promise<WhatsAppSession | null> {
    const q = query(
      collection(db, this.collectionName),
      where('userId', '==', userId),
      where('isActive', '==', true)
    );

    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        createdAt: new Date(data.createdAt),
        updatedAt: new Date(data.updatedAt),
        lastActivity: new Date(data.lastActivity),
      } as WhatsAppSession;
    }

    return null;
  }

  // Get session by phone number
  async getByPhoneNumber(phoneNumber: string): Promise<WhatsAppSession | null> {
    const q = query(
      collection(db, this.collectionName),
      where('phoneNumber', '==', phoneNumber),
      where('isActive', '==', true)
    );

    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        createdAt: new Date(data.createdAt),
        updatedAt: new Date(data.updatedAt),
        lastActivity: new Date(data.lastActivity),
      } as WhatsAppSession;
    }

    return null;
  }

  // Update session
  async update(id: string, updates: Partial<Omit<WhatsAppSession, 'id' | 'createdAt'>>): Promise<void> {
    const sessionRef = doc(db, this.collectionName, id);
    const updateData: any = {
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    // Convert dates to ISO strings
    if (updates.lastActivity instanceof Date) {
      updateData.lastActivity = updates.lastActivity.toISOString();
    }

    await updateDoc(sessionRef, updateData);
  }

  // Update last activity
  async updateLastActivity(id: string): Promise<void> {
    await this.update(id, { lastActivity: new Date() });
  }

  // Deactivate session
  async deactivate(id: string): Promise<void> {
    await this.update(id, { isActive: false });
  }

  // Get all active sessions (admin function)
  async getAllActive(limitCount = 100): Promise<WhatsAppSession[]> {
    const q = query(
      collection(db, this.collectionName),
      where('isActive', '==', true),
      orderBy('lastActivity', 'desc'),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        createdAt: new Date(data.createdAt),
        updatedAt: new Date(data.updatedAt),
        lastActivity: new Date(data.lastActivity),
      } as WhatsAppSession;
    });
  }

  // Get inactive sessions older than specified days
  async getInactiveSessions(daysOld = 30): Promise<WhatsAppSession[]> {
    const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);

    const q = query(
      collection(db, this.collectionName),
      where('isActive', '==', false),
      where('lastActivity', '<', cutoffDate.toISOString())
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        createdAt: new Date(data.createdAt),
        updatedAt: new Date(data.updatedAt),
        lastActivity: new Date(data.lastActivity),
      } as WhatsAppSession;
    });
  }

  // Clean up old inactive sessions
  async cleanupOldSessions(daysOld = 90): Promise<number> {
    const oldSessions = await this.getInactiveSessions(daysOld);

    // Note: Firestore doesn't support batch deletes in the web SDK
    // In production, you might want to use Cloud Functions for this
    let deletedCount = 0;
    for (const session of oldSessions) {
      try {
        // This is a simplified approach - in production use batch operations
        await this.update(session.id, { isActive: false });
        deletedCount++;
      } catch (error) {
        console.error(`Failed to cleanup session ${session.id}:`, error);
      }
    }

    return deletedCount;
  }
}

export const whatsappSessionCollection = new WhatsAppSessionCollection();
