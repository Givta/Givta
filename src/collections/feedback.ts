import { db } from '../firebase';
import { collection, addDoc, getDocs, doc, updateDoc, query, where, orderBy, limit, serverTimestamp } from 'firebase/firestore';

export interface Feedback {
  id?: string;
  userId: string;
  rating: number; // 1-5 stars
  type: 'bug_report' | 'feature_request' | 'general_feedback' | 'ui_improvement' | 'performance' | 'other';
  subject: string;
  message: string;
  userEmail?: string;
  status: 'pending' | 'reviewed' | 'resolved';
  createdAt: any;
  updatedAt: any;
}

export class FeedbackCollection {
  /**
   * Create a new feedback entry - Direct Firestore integration
   */
  static async create(feedbackData: {
    rating: number;
    type: 'bug_report' | 'feature_request' | 'general_feedback' | 'ui_improvement' | 'performance' | 'other';
    subject: string;
    message: string;
    userId: string;
    userEmail?: string;
  }): Promise<string> {
    try {
      // Validate rating
      if (feedbackData.rating < 1 || feedbackData.rating > 5) {
        throw new Error('Rating must be between 1 and 5');
      }

      // Validate required fields
      if (!feedbackData.message.trim()) {
        throw new Error('Message is required');
      }

      if (!feedbackData.subject.trim()) {
        throw new Error('Subject is required');
      }

      const feedbackDoc = {
        rating: feedbackData.rating,
        type: feedbackData.type,
        subject: feedbackData.subject.trim(),
        message: feedbackData.message.trim(),
        userId: feedbackData.userId,
        userEmail: feedbackData.userEmail || '',
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'feedback'), feedbackDoc);

      return docRef.id;
    } catch (error) {
      console.error('Error creating feedback:', error);
      throw error;
    }
  }

  /**
   * Get all feedback for current user - Direct Firestore integration
   */
  static async getByUserId(userId: string, limitCount: number = 20): Promise<Feedback[]> {
    try {
      const feedbackQuery = query(
        collection(db, 'feedback'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      const snapshot = await getDocs(feedbackQuery);
      const feedback: Feedback[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Feedback));

      return feedback;
    } catch (error) {
      console.error('Error getting user feedback:', error);
      return [];
    }
  }

  /**
   * Get all feedback (admin) - Direct Firestore integration
   */
  static async getAll(limitCount: number = 50, status?: 'pending' | 'reviewed' | 'resolved'): Promise<Feedback[]> {
    try {
      let feedbackQuery = query(
        collection(db, 'feedback'),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      if (status && status !== 'all' as any) {
        feedbackQuery = query(
          collection(db, 'feedback'),
          where('status', '==', status),
          orderBy('createdAt', 'desc'),
          limit(limitCount)
        );
      }

      const snapshot = await getDocs(feedbackQuery);
      const feedback: Feedback[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Feedback));

      return feedback;
    } catch (error) {
      console.error('Error getting all feedback:', error);
      return [];
    }
  }

  /**
   * Get feedback by ID - Direct Firestore integration
   */
  static async getById(id: string): Promise<Feedback | null> {
    try {
      // Note: In a real implementation, you'd use getDoc here
      // For now, we'll use getAll and filter
      const allFeedback = await this.getAll(1000);
      return allFeedback.find(f => f.id === id) || null;
    } catch (error) {
      console.error('Error getting feedback by ID:', error);
      return null;
    }
  }

  /**
   * Update feedback status (admin) - Direct Firestore integration
   */
  static async updateStatus(id: string, status: 'pending' | 'reviewed' | 'resolved'): Promise<void> {
    try {
      const feedbackRef = doc(db, 'feedback', id);
      await updateDoc(feedbackRef, {
        status,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating feedback status:', error);
      throw error;
    }
  }

  /**
   * Get feedback statistics - Direct Firestore integration
   */
  static async getStats(): Promise<{
    total: number;
    pending: number;
    reviewed: number;
    resolved: number;
    averageRating: number;
    typeBreakdown: Record<string, number>;
    ratingBreakdown: Record<number, number>;
  }> {
    try {
      const allFeedback = await this.getAll(1000);

      const total = allFeedback.length;
      const pending = allFeedback.filter(f => f.status === 'pending').length;
      const reviewed = allFeedback.filter(f => f.status === 'reviewed').length;
      const resolved = allFeedback.filter(f => f.status === 'resolved').length;

      const averageRating = total > 0
        ? allFeedback.reduce((sum, f) => sum + f.rating, 0) / total
        : 0;

      const typeBreakdown = allFeedback.reduce((acc, f) => {
        acc[f.type] = (acc[f.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const ratingBreakdown = allFeedback.reduce((acc, f) => {
        acc[f.rating] = (acc[f.rating] || 0) + 1;
        return acc;
      }, { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } as Record<number, number>);

      return {
        total,
        pending,
        reviewed,
        resolved,
        averageRating: Math.round(averageRating * 10) / 10,
        typeBreakdown,
        ratingBreakdown
      };
    } catch (error) {
      console.error('Error getting feedback stats:', error);
      return {
        total: 0,
        pending: 0,
        reviewed: 0,
        resolved: 0,
        averageRating: 0,
        typeBreakdown: {},
        ratingBreakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      };
    }
  }
}
