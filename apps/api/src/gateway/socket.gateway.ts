import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class SocketGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(SocketGateway.name);

  @WebSocketServer()
  server: Server;

  // Maps userId to socketId
  private activeClients = new Map<string, string>();

  afterInit(server: Server) {
    this.logger.log('Socket.io Gateway initialized');
  }

  handleConnection(client: Socket) {
    const userId = client.handshake.query.userId as string;
    if (userId) {
      this.activeClients.set(userId, client.id);
      this.logger.log(`Client connected: user ${userId} (socket ID: ${client.id})`);
    } else {
      this.logger.log(`Client connected without user credential ID (socket ID: ${client.id})`);
    }
  }

  handleDisconnect(client: Socket) {
    // Remove client mapping
    for (const [userId, socketId] of this.activeClients.entries()) {
      if (socketId === client.id) {
        this.activeClients.delete(userId);
        this.logger.log(`Client disconnected: user ${userId} (socket ID: ${client.id})`);
        break;
      }
    }
  }

  @SubscribeMessage('joinOrderRoom')
  handleJoinOrderRoom(
    @MessageBody('orderId') orderId: string,
    @ConnectedSocket() client: Socket,
  ) {
    if (orderId) {
      client.join(`order_room_${orderId}`);
      this.logger.log(`Socket client ${client.id} joined order room: order_room_${orderId}`);
      return { status: 'joined', orderId };
    }
    return { error: 'No order ID provided' };
  }

  @SubscribeMessage('updateDriverLocation')
  handleDriverLocationUpdate(
    @MessageBody()
    data: {
      orderId: string;
      latitude: number;
      longitude: number;
      driverId: string;
    },
  ) {
    const { orderId, latitude, longitude, driverId } = data;
    if (orderId) {
      this.logger.log(
        `Rider location sync for order ${orderId}: lat ${latitude}, lng ${longitude}`,
      );
      this.server.to(`order_room_${orderId}`).emit('driverLocationUpdate', {
        orderId,
        latitude,
        longitude,
        driverId,
      });
      return { success: true };
    }
    return { success: false, error: 'No order ID provided' };
  }

  sendRealtimeNotification(userId: string, notification: any) {
    const socketId = this.activeClients.get(userId);
    if (socketId) {
      this.server.to(socketId).emit('notification', notification);
      this.logger.log(`Pushed real-time notification to user ${userId}`);
      return true;
    }
    this.logger.warn(`Could not push real-time notification: User ${userId} is currently offline`);
    return false;
  }

  sendOrderLifecycleUpdate(orderId: string, status: string, eta: string) {
    this.server.to(`order_room_${orderId}`).emit('orderStatusUpdate', {
      orderId,
      status,
      eta,
    });
    this.logger.log(`Dispatched real-time status update to order_room_${orderId}: ${status}`);
  }
}
