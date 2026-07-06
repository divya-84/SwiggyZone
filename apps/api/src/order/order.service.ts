import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { NotificationService } from '../notification/notification.service';
import { PaymentService } from '../payment/payment.service';
import { SocketGateway } from '../gateway/socket.gateway';
import {
  OrderStatus,
  PaymentStatus,
  NotificationType,
  UserRoleName,
  DiscountType,
} from '@prisma/client';

@Injectable()
export class OrderService {
  constructor(
    private prisma: PrismaService,
    private notificationService: NotificationService,
    private paymentService: PaymentService,
    private socketGateway: SocketGateway,
  ) {}

  async createOrder(
    userId: string,
    dto: {
      restaurantId: string;
      addressId: string;
      couponCode?: string;
      notes?: string;
      items: { menuItemId: string; quantity: number }[];
    },
  ) {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('Order items list cannot be empty');
    }

    // 1. Verify restaurant
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: dto.restaurantId },
    });
    if (!restaurant) throw new NotFoundException('Restaurant not found');

    // 2. Verify address
    const address = await this.prisma.address.findUnique({
      where: { id: dto.addressId },
    });
    if (!address || address.userId !== userId) {
      throw new BadRequestException('Invalid shipping address selected');
    }

    // 3. Process items and calculate pricing
    let subtotal = 0;
    const itemsWithPrice = [];

    for (const item of dto.items) {
      const menuItem = await this.prisma.menuItem.findUnique({
        where: { id: item.menuItemId },
        include: { inventory: true },
      });

      if (!menuItem || menuItem.categoryId === null) {
        throw new NotFoundException(`Menu item ${item.menuItemId} not found`);
      }

      if (!menuItem.isAvailable) {
        throw new BadRequestException(`Item ${menuItem.name} is currently out of stock`);
      }

      // Check inventory
      if (menuItem.inventory && menuItem.inventory.quantity < item.quantity) {
        throw new BadRequestException(`Insufficient inventory for item ${menuItem.name}`);
      }

      const itemTotal = menuItem.price * item.quantity;
      subtotal += itemTotal;

      itemsWithPrice.push({
        menuItemId: menuItem.id,
        quantity: item.quantity,
        price: menuItem.price,
      });
    }

    // 4. Calculate coupon discount
    let discount = 0;
    if (dto.couponCode) {
      const coupon = await this.prisma.coupon.findUnique({
        where: { code: dto.couponCode },
      });

      if (
        coupon &&
        coupon.isActive &&
        coupon.expiresAt > new Date() &&
        coupon.usedCount < coupon.maxUses
      ) {
        if (subtotal >= coupon.minOrderValue) {
          if (coupon.discountType === DiscountType.PERCENTAGE) {
            const calculated = (subtotal * coupon.discountValue) / 100;
            discount = coupon.maxDiscount ? Math.min(calculated, coupon.maxDiscount) : calculated;
          } else {
            discount = coupon.discountValue; // Flat discount
          }
          await this.prisma.coupon.update({
            where: { code: dto.couponCode },
            data: { usedCount: { increment: 1 } },
          });
        }
      }
    }

    const deliveryFee = 40.0;
    const tax = subtotal * 0.05; // 5% GST
    const total = Math.max(0, subtotal + tax + deliveryFee - discount);

    // 5. Create Order entry
    const order = await this.prisma.order.create({
      data: {
        userId,
        restaurantId: dto.restaurantId,
        addressId: dto.addressId,
        status: OrderStatus.PLACED,
        subtotal,
        deliveryFee,
        tax,
        discount,
        total,
        couponCode: dto.couponCode,
        notes: dto.notes,
        items: {
          create: itemsWithPrice,
        },
      },
      include: {
        items: true,
      },
    });

    // 6. Deduct inventory quantities
    for (const item of dto.items) {
      await this.prisma.inventory.update({
        where: { menuItemId: item.menuItemId },
        data: { quantity: { decrement: item.quantity } },
      });
    }

    // 7. Dispatch notifications
    await this.notificationService.sendNotification(
      userId,
      'Order Placed Successfully',
      `Your order #${order.id.substring(0, 8)} at ${restaurant.name} has been placed. Waiting for payment completion.`,
      NotificationType.ORDER_UPDATE,
    );

    return order;
  }

  async updateOrderStatus(
    orderId: string,
    nextStatus: OrderStatus,
    userId: string,
    userRole: UserRoleName,
  ) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { restaurant: true, payment: true },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Role guard validations
    if (userRole === UserRoleName.RESTAURANT_OWNER && order.restaurant.ownerId !== userId) {
      throw new ForbiddenException('Not authorized for this restaurant queue');
    }

    // Transition state
    const updatedOrder = await this.prisma.order.update({
      where: { id: orderId },
      data: { status: nextStatus },
    });

    // Write to audit log
    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'UPDATE_STATUS',
        tableName: 'Order',
        recordId: orderId,
        oldValues: JSON.stringify({ status: order.status }),
        newValues: JSON.stringify({ status: nextStatus }),
      },
    });

    // Dispatch status notification alerts
    const statusMessages: Record<OrderStatus, string> = {
      [OrderStatus.PLACED]: 'Your order has been placed',
      [OrderStatus.ACCEPTED]: 'Kitchen accepted your order and preparing food',
      [OrderStatus.PREPARING]: 'Chef is cooking your delicious meal',
      [OrderStatus.READY]: 'Your order is ready and waiting for rider assignment',
      [OrderStatus.PICKED_UP]: 'Rider has picked up your food and is on the way',
      [OrderStatus.DELIVERED]: 'Food delivered. Bon appétit!',
      [OrderStatus.CANCELLED]: 'Your order has been cancelled',
    };

    const text = statusMessages[nextStatus] || 'Your order status has changed';

    await this.notificationService.sendNotification(
      order.userId,
      `Order Status Update: ${nextStatus}`,
      text,
      NotificationType.ORDER_UPDATE,
    );

    // Socket lifecycle update
    this.socketGateway.sendOrderLifecycleUpdate(orderId, nextStatus, '20 mins');

    return updatedOrder;
  }

  async cancelOrder(orderId: string, userId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { payment: true },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.userId !== userId) {
      throw new ForbiddenException('Not authorized to cancel this order');
    }

    if (order.status !== OrderStatus.PLACED && order.status !== OrderStatus.ACCEPTED) {
      throw new BadRequestException('Cannot cancel order after food preparation has started');
    }

    // Cancel order status
    const updatedOrder = await this.prisma.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.CANCELLED },
    });

    // Process refund if payment succeeded
    if (order.payment && order.payment.status === PaymentStatus.SUCCESSFUL) {
      await this.paymentService.processRefund(order.payment.id, userId);
    }

    await this.notificationService.sendNotification(
      userId,
      'Order Cancelled',
      `Your order #${orderId.substring(0, 8)} has been cancelled.`,
      NotificationType.ORDER_UPDATE,
    );

    // Socket cancellation emit
    this.socketGateway.sendOrderLifecycleUpdate(orderId, OrderStatus.CANCELLED, '0 mins');

    return updatedOrder;
  }

  async getCustomerOrders(userId: string) {
    return this.prisma.order.findMany({
      where: { userId },
      include: {
        items: {
          include: { menuItem: true },
        },
        restaurant: true,
        payment: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getRestaurantOrders(restaurantId: string, ownerId: string) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
    });

    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }

    if (restaurant.ownerId !== ownerId) {
      throw new ForbiddenException('Not authorized for this restaurant queue');
    }

    return this.prisma.order.findMany({
      where: { restaurantId },
      include: {
        items: {
          include: { menuItem: true },
        },
        payment: true,
        user: {
          select: { firstName: true, lastName: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
