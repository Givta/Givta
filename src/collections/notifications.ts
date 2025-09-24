import { db } from '../firebase';
import { collection, doc, setDoc, getDoc, updateDoc, query, where, getDocs, orderBy, limit } from 'firebase/firestore';

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'transaction' | 'referral' | 'tip' | 'system' | 'promotion' | 'security';
  read: boolean;
  data?: {
    transactionId?: string;
    referralId?: string;
    tipId?: string;
    amount?: number;
    actionUrl?: string;
  };
  createdAt: Date;
  updatedAt: Date;
  readAt?: Date;
  expiresAt?: Date;
}

export class NotificationCollection {
  private collectionName = 'notifications';

  // Create a new notification
  async create(notificationData: Omit<Notification, 'id' | 'createdAt' | 'updatedAt'>): Promise<Notification> {
    const notificationRef = doc(collection(db, this.collectionName));
    const now = new Date();

    const notification: Notification = {
      ...notificationData,
      id: notificationRef.id,
      createdAt: now,
      updatedAt: now,
    };

    await setDoc(notificationRef, {
      ...notification,
      createdAt: notification.createdAt.toISOString(),
      updatedAt: notification.updatedAt.toISOString(),
      readAt: notification.readAt?.toISOString(),
      expiresAt: notification.expiresAt?.toISOString(),
    });

    return notification;
  }

  // Get notification by ID
  async getById(id: string): Promise<Notification | null> {
    const notificationRef = doc(db, this.collectionName, id);
    const notificationSnap = await getDoc(notificationRef);

    if (notificationSnap.exists()) {
      const data = notificationSnap.data();
      return {
        ...data,
        id: notificationSnap.id,
        createdAt: new Date(data.createdAt),
        updatedAt: new Date(data.updatedAt),
        readAt: data.readAt ? new Date(data.readAt) : undefined,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
      } as Notification;
    }

    return null;
  }

  // Get user's notifications
  async getByUserId(
    userId: string,
    limitCount = 20,
    includeRead = true
  ): Promise<Notification[]> {
    let q = query(
      collection(db, this.collectionName),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    if (!includeRead) {
      q = query(q, where('read', '==', false));
    }

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        createdAt: new Date(data.createdAt),
        updatedAt: new Date(data.updatedAt),
        readAt: data.readAt ? new Date(data.readAt) : undefined,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
      } as Notification;
    });
  }

  // Get unread notifications count
  async getUnreadCount(userId: string): Promise<number> {
    const q = query(
      collection(db, this.collectionName),
      where('userId', '==', userId),
      where('read', '==', false)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.size;
  }

  // Get notifications by type
  async getByType(
    userId: string,
    type: Notification['type'],
    limitCount = 20
  ): Promise<Notification[]> {
    const q = query(
      collection(db, this.collectionName),
      where('userId', '==', userId),
      where('type', '==', type),
      orderBy('createdAt', 'desc'),
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
        readAt: data.readAt ? new Date(data.readAt) : undefined,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
      } as Notification;
    });
  }

  // Update notification
  async update(id: string, updates: Partial<Omit<Notification, 'id' | 'createdAt'>>): Promise<void> {
    const notificationRef = doc(db, this.collectionName, id);
    const updateData: any = {
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    // Convert dates to ISO strings
    if (updates.readAt instanceof Date) {
      updateData.readAt = updates.readAt.toISOString();
    }
    if (updates.expiresAt instanceof Date) {
      updateData.expiresAt = updates.expiresAt.toISOString();
    }

    await updateDoc(notificationRef, updateData);
  }

  // Mark notification as read
  async markAsRead(id: string): Promise<void> {
    await this.update(id, {
      read: true,
      readAt: new Date(),
    });
  }

  // Mark all user notifications as read
  async markAllAsRead(userId: string): Promise<void> {
    const notifications = await this.getByUserId(userId, 100, false); // Only unread

    const updatePromises = notifications.map(notification =>
      this.markAsRead(notification.id)
    );

    await Promise.all(updatePromises);
  }

  // Create transaction notification
  async createTransactionNotification(
    userId: string,
    transactionType: string,
    amount: number,
    status: string
  ): Promise<Notification> {
    const title = `${transactionType.charAt(0).toUpperCase() + transactionType.slice(1)} ${status}`;
    const message = `Your ${transactionType} of ₦${amount.toLocaleString()} has been ${status.toLowerCase()}.`;

    return this.create({
      userId,
      title,
      message,
      type: 'transaction',
      read: false,
      data: { amount },
    });
  }

  // Create referral notification
  async createReferralNotification(
    userId: string,
    bonus: number,
    level: number
  ): Promise<Notification> {
    const title = 'Referral Bonus Earned!';
    const message = `Congratulations! You've earned ₦${bonus.toLocaleString()} from a level ${level} referral.`;

    return this.create({
      userId,
      title,
      message,
      type: 'referral',
      read: false,
      data: { amount: bonus },
    });
  }

  // Create tip notification
  async createTipNotification(
    userId: string,
    amount: number,
    senderName?: string
  ): Promise<Notification> {
    const title = 'Tip Received!';
    const message = senderName
      ? `${senderName} sent you a tip of ₦${amount.toLocaleString()}!`
      : `You received a tip of ₦${amount.toLocaleString()}!`;

    return this.create({
      userId,
      title,
      message,
      type: 'tip',
      read: false,
      data: { amount },
    });
  }

  // Create system notification
  async createSystemNotification(
    userId: string,
    title: string,
    message: string,
    expiresAt?: Date
  ): Promise<Notification> {
    return this.create({
      userId,
      title,
      message,
      type: 'system',
      read: false,
      expiresAt,
    });
  }

  // Create promotional notification
  async createPromotionNotification(
    userId: string,
    title: string,
    message: string,
    actionUrl?: string
  ): Promise<Notification> {
    return this.create({
      userId,
      title,
      message,
      type: 'promotion',
      read: false,
      data: { actionUrl },
    });
  }

  // Get notifications summary for user
  async getSummary(userId: string): Promise<{
    total: number;
    unread: number;
    byType: {
      transaction: number;
      referral: number;
      tip: number;
      system: number;
      promotion: number;
      security: number;
    };
  }> {
    const notifications = await this.getByUserId(userId, 1000); // Get all notifications

    const summary = {
      total: notifications.length,
      unread: 0,
      byType: {
        transaction: 0,
        referral: 0,
        tip: 0,
        system: 0,
        promotion: 0,
        security: 0,
      },
    };

    notifications.forEach(notification => {
      if (!notification.read) {
        summary.unread++;
      }
      summary.byType[notification.type]++;
    });

    return summary;
  }

  // Clean up expired notifications (admin function)
  async cleanupExpired(): Promise<number> {
    const now = new Date();
    const q = query(
      collection(db, this.collectionName),
      where('expiresAt', '<=', now.toISOString())
    );

    const querySnapshot = await getDocs(q);

    // Note: Firestore doesn't support delete queries directly
    // This would need to be implemented with individual deletes
    // or handled by a backend service

    return querySnapshot.size;
  }

  // Get all notifications (admin function)
  async getAll(limitCount = 100): Promise<Notification[]> {
    const q = query(
      collection(db, this.collectionName),
      orderBy('createdAt', 'desc'),
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
        readAt: data.readAt ? new Date(data.readAt) : undefined,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
      } as Notification;
    });
  }
}

export const notificationCollection = new NotificationCollection();
