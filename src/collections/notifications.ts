import { apiService } from '../services/api';

export interface Notification {
  id: string;
  userId?: string; // Optional since API may not always return it
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
  data?: {
    transactionId?: string;
    referralId?: string;
    tipId?: string;
    amount?: number;
    actionUrl?: string;
  };
  updatedAt?: string;
  readAt?: string;
  expiresAt?: string;
}

export class NotificationCollection {
  // Get current user's notifications from API
  async getByUserId(
    userId: string,
    limitCount = 20,
    includeRead = true
  ): Promise<Notification[]> {
    const response = await apiService.getNotifications(limitCount);
    if (response.success && response.data && response.data.notifications) {
      let notifications = response.data.notifications;

      // Filter out read notifications if includeRead is false
      if (!includeRead) {
        notifications = notifications.filter(notification => !notification.read);
      }

      return notifications;
    }
    return [];
  }

  // Get unread notifications count
  async getUnreadCount(userId: string): Promise<number> {
    const response = await apiService.getNotifications(100); // Get more to check all
    if (response.success && response.data && response.data.notifications) {
      return response.data.notifications.filter(notification => !notification.read).length;
    }
    return 0;
  }

  // Mark notification as read (uses API directly)
  async markAsRead(id: string): Promise<void> {
    await apiService.markNotificationAsRead(id);
  }

  // Mark all user notifications as read (uses API directly)
  async markAllAsRead(userId: string): Promise<void> {
    await apiService.markAllNotificationsAsRead();
  }

  // Get notifications summary for user
  async getSummary(userId: string): Promise<{
    total: number;
    unread: number;
    byType: Record<string, number>;
  }> {
    const notifications = await this.getByUserId(userId, 1000); // Get all notifications

    const summary = {
      total: notifications.length,
      unread: 0,
      byType: {} as Record<string, number>,
    };

    notifications.forEach(notification => {
      if (!notification.read) {
        summary.unread++;
      }
      const type = notification.type;
      summary.byType[type] = (summary.byType[type] || 0) + 1;
    });

    return summary;
  }
}

export const notificationCollection = new NotificationCollection();
