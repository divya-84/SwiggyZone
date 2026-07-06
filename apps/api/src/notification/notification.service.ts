import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { SocketGateway } from '../gateway/socket.gateway';
import { NotificationType } from '@prisma/client';

@Injectable()
export class NotificationService {
  constructor(
    private prisma: PrismaService,
    private socketGateway: SocketGateway,
  ) {}

  private preferencesStore: Record<
    string,
    { push: boolean; email: boolean; sms: boolean; whatsapp: boolean; inApp: boolean }
  > = {};
  private queueJobs: any[] = [];
  private queueLogs: string[] = [
    `[${new Date().toLocaleTimeString()}] [System] Notification queue processor online.`,
  ];

  async sendNotification(
    userId: string,
    title: string,
    content: string,
    type: NotificationType = NotificationType.SYSTEM,
  ) {
    const notification = await this.prisma.notification.create({
      data: {
        userId,
        title,
        content,
        type,
      },
    });

    // Push via websocket
    this.socketGateway.sendRealtimeNotification(userId, notification);

    return notification;
  }

  async getUserNotifications(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }

  async markAsRead(notificationId: string, userId: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    if (notification.userId !== userId) {
      throw new ForbiddenException('Not authorized for this notification');
    }

    return this.prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });
  }

  // Retrieve user channel preferences
  getPreferences(userId: string) {
    if (!this.preferencesStore[userId]) {
      this.preferencesStore[userId] = {
        push: true,
        email: true,
        sms: false,
        whatsapp: true,
        inApp: true,
      };
    }
    return this.preferencesStore[userId];
  }

  // Update user channel preferences
  updatePreferences(userId: string, preferences: any) {
    const current = this.getPreferences(userId);
    this.preferencesStore[userId] = {
      push: preferences.push ?? current.push,
      email: preferences.email ?? current.email,
      sms: preferences.sms ?? current.sms,
      whatsapp: preferences.whatsapp ?? current.whatsapp,
      inApp: preferences.inApp ?? current.inApp,
    };
    this.addQueueLog(
      `[Preferences] User updated preferences: ${JSON.stringify(this.preferencesStore[userId])}`,
    );
    return this.preferencesStore[userId];
  }

  // Retrieve active queue status
  getQueueStatus() {
    return {
      jobs: this.queueJobs.slice(0, 30),
      logs: this.queueLogs.slice(-40),
    };
  }

  private addQueueLog(message: string) {
    const time = new Date().toLocaleTimeString();
    this.queueLogs.push(`[${time}] ${message}`);
  }

  // Trigger test template dispatch across selected channels
  async triggerNotification(userId: string, templateKey: string, channels: string[]) {
    const preferences = this.getPreferences(userId);

    const templates: Record<string, { title: string; content: string }> = {
      ORDER_PLACED: {
        title: 'Order Confirmed 🍔',
        content:
          'Your order #8a9c7b from Saffron Hub Kitchen has been confirmed. Expected delivery in 35 mins.',
      },
      ORDER_READY: {
        title: 'Food is Ready! 📦',
        content: 'Food packed at Saffron Hub. Rider is picking it up.',
      },
      PROMO_BLAST: {
        title: 'Craving Biryani? 🍛',
        content: 'Use promo code BATCH30 for flat 30% discount on Saffron Chicken Biryani today!',
      },
      WALLET_UPDATE: {
        title: 'Wallet Credited 💰',
        content: 'Refund of ₹240.00 credited back to your wallet balance.',
      },
    };

    const template = templates[templateKey] || {
      title: 'Alert Notification',
      content: 'Standard test alert message from SwiggyZone.',
    };

    for (const channel of channels) {
      const jobId = `job-${Math.floor(1000 + Math.random() * 9000)}`;
      const job = {
        id: jobId,
        userId,
        templateKey,
        channel,
        title: template.title,
        content: template.content,
        status: 'QUEUED',
        createdAt: new Date(),
      };

      this.queueJobs.unshift(job);
      this.addQueueLog(`[Queue] Enqueued ${channel.toUpperCase()} job: ${jobId}`);

      // Process asynchronously
      setTimeout(async () => {
        job.status = 'PROCESSING';
        this.addQueueLog(`[Worker] Processing ${channel.toUpperCase()} dispatch: ${jobId}`);

        // Simulate 800ms dispatch latency
        setTimeout(async () => {
          const isEnabled = preferences[channel as keyof typeof preferences];
          if (!isEnabled) {
            job.status = 'FAILED';
            this.addQueueLog(
              `[Worker] ${channel.toUpperCase()} dispatch failed: Channel disabled in preferences.`,
            );
            return;
          }

          if (channel === 'inApp') {
            await this.sendNotification(
              userId,
              template.title,
              template.content,
              NotificationType.SYSTEM,
            );
          }

          job.status = 'COMPLETED';
          this.addQueueLog(`[Worker] ${channel.toUpperCase()} delivered successfully.`);
        }, 800);
      }, 500);
    }

    return { success: true, queuedJobsCount: channels.length };
  }
}
