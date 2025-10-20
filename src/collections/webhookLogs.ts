import { db } from '../firebase';
import { collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, query, where, orderBy, limit, Timestamp } from 'firebase/firestore';

export interface WebhookLog {
  id?: string;
  provider: 'paystack' | 'flutterwave' | 'stripe' | 'other';
  eventType: string;
  payload: any;
  headers?: any;
  status: 'received' | 'processing' | 'processed' | 'failed';
  response?: any;
  error?: string;
  processingTime?: number; // in milliseconds
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
  processedAt?: Date;
  retryCount: number;
  maxRetries: number;
}

export class WebhookLogsCollection {
  private static collectionName = 'webhookLogs';

  /**
   * Create a new webhook log
   */
  static async create(webhookLog: Omit<WebhookLog, 'id' | 'createdAt' | 'retryCount'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, this.collectionName), {
        ...webhookLog,
        retryCount: 0,
        createdAt: Timestamp.now(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating webhook log:', error);
      throw error;
    }
  }

  /**
   * Get webhook log by ID
   */
  static async getById(id: string): Promise<WebhookLog | null> {
    try {
      const docRef = doc(db, this.collectionName, id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          processedAt: data.processedAt?.toDate(),
        } as WebhookLog;
      }
      return null;
    } catch (error) {
      console.error('Error getting webhook log:', error);
      throw error;
    }
  }

  /**
   * Get webhook logs by provider
   */
  static async getByProvider(provider: string, limitCount: number = 50): Promise<WebhookLog[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('provider', '==', provider),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          processedAt: data.processedAt?.toDate(),
        } as WebhookLog;
      });
    } catch (error) {
      console.error('Error getting webhook logs by provider:', error);
      throw error;
    }
  }

  /**
   * Get webhook logs by event type
   */
  static async getByEventType(eventType: string, limitCount: number = 50): Promise<WebhookLog[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('eventType', '==', eventType),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          processedAt: data.processedAt?.toDate(),
        } as WebhookLog;
      });
    } catch (error) {
      console.error('Error getting webhook logs by event type:', error);
      throw error;
    }
  }

  /**
   * Get webhook logs by status
   */
  static async getByStatus(status: 'received' | 'processing' | 'processed' | 'failed', limitCount: number = 50): Promise<WebhookLog[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('status', '==', status),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          processedAt: data.processedAt?.toDate(),
        } as WebhookLog;
      });
    } catch (error) {
      console.error('Error getting webhook logs by status:', error);
      throw error;
    }
  }

  /**
   * Update webhook log
   */
  static async update(id: string, updates: Partial<WebhookLog>): Promise<void> {
    try {
      const docRef = doc(db, this.collectionName, id);
      await updateDoc(docRef, updates);
    } catch (error) {
      console.error('Error updating webhook log:', error);
      throw error;
    }
  }

  /**
   * Mark webhook as processed
   */
  static async markAsProcessed(id: string, response?: any, processingTime?: number): Promise<void> {
    try {
      const updates: Partial<WebhookLog> = {
        status: 'processed',
        processedAt: new Date(),
      };

      if (response) {
        updates.response = response;
      }

      if (processingTime) {
        updates.processingTime = processingTime;
      }

      await this.update(id, updates);
    } catch (error) {
      console.error('Error marking webhook as processed:', error);
      throw error;
    }
  }

  /**
   * Mark webhook as failed
   */
  static async markAsFailed(id: string, error: string, retryCount?: number): Promise<void> {
    try {
      const updates: Partial<WebhookLog> = {
        status: 'failed',
        error,
      };

      if (retryCount !== undefined) {
        updates.retryCount = retryCount;
      }

      await this.update(id, updates);
    } catch (error) {
      console.error('Error marking webhook as failed:', error);
      throw error;
    }
  }

  /**
   * Increment retry count
   */
  static async incrementRetryCount(id: string): Promise<void> {
    try {
      const log = await this.getById(id);
      if (log) {
        await this.update(id, {
          retryCount: (log.retryCount || 0) + 1,
        });
      }
    } catch (error) {
      console.error('Error incrementing retry count:', error);
      throw error;
    }
  }

  /**
   * Delete webhook log
   */
  static async delete(id: string): Promise<void> {
    try {
      const docRef = doc(db, this.collectionName, id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting webhook log:', error);
      throw error;
    }
  }

  /**
   * Get webhook logs statistics
   */
  static async getStats(timeRange?: { start: Date; end: Date }): Promise<{
    total: number;
    received: number;
    processing: number;
    processed: number;
    failed: number;
    averageProcessingTime: number;
    providerBreakdown: Record<string, number>;
    eventTypeBreakdown: Record<string, number>;
  }> {
    try {
      let logs: WebhookLog[] = [];

      if (timeRange) {
        const timeRangeQuery = query(
          collection(db, this.collectionName),
          where('createdAt', '>=', Timestamp.fromDate(timeRange.start)),
          where('createdAt', '<=', Timestamp.fromDate(timeRange.end))
        );
        const querySnapshot = await getDocs(timeRangeQuery);
        logs = querySnapshot.docs.map(doc => doc.data()) as WebhookLog[];
      } else {
        const querySnapshot = await getDocs(collection(db, this.collectionName));
        logs = querySnapshot.docs.map(doc => doc.data()) as WebhookLog[];
      }

      const processedLogs = logs.filter(log => log.status === 'processed');
      const averageProcessingTime = processedLogs.length > 0
        ? processedLogs.reduce((sum, log) => sum + (log.processingTime || 0), 0) / processedLogs.length
        : 0;

      const stats = {
        total: logs.length,
        received: logs.filter(log => log.status === 'received').length,
        processing: logs.filter(log => log.status === 'processing').length,
        processed: logs.filter(log => log.status === 'processed').length,
        failed: logs.filter(log => log.status === 'failed').length,
        averageProcessingTime,
        providerBreakdown: logs.reduce((acc, log) => {
          acc[log.provider] = (acc[log.provider] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        eventTypeBreakdown: logs.reduce((acc, log) => {
          acc[log.eventType] = (acc[log.eventType] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
      };

      return stats;
    } catch (error) {
      console.error('Error getting webhook logs stats:', error);
      throw error;
    }
  }

  /**
   * Clean up old webhook logs (older than specified days)
   */
  static async cleanupOldLogs(daysOld: number = 30): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      // Note: This is a simplified cleanup. In a real implementation,
      // you might want to use Firebase Cloud Functions or a scheduled job
      // to handle this more efficiently for large datasets

      const q = query(
        collection(db, this.collectionName),
        where('createdAt', '<', Timestamp.fromDate(cutoffDate)),
        orderBy('createdAt', 'desc'),
        limit(100) // Process in batches
      );

      const querySnapshot = await getDocs(q);
      const deletePromises = querySnapshot.docs.map(doc => this.delete(doc.id));

      await Promise.all(deletePromises);
      return querySnapshot.size;
    } catch (error) {
      console.error('Error cleaning up old webhook logs:', error);
      throw error;
    }
  }

  /**
   * Get failed webhooks for retry
   */
  static async getFailedForRetry(maxRetries: number = 3): Promise<WebhookLog[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('status', '==', 'failed'),
        where('retryCount', '<', maxRetries),
        orderBy('retryCount', 'asc'),
        orderBy('createdAt', 'asc'),
        limit(50)
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          processedAt: data.processedAt?.toDate(),
        } as WebhookLog;
      });
    } catch (error) {
      console.error('Error getting failed webhooks for retry:', error);
      throw error;
    }
  }
}
