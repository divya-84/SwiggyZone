import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import Stripe from 'stripe';
import Razorpay from 'razorpay';
import { PaymentStatus, OrderStatus, WalletTransactionType, PaymentMethod } from '@prisma/client';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);
  private stripe: Stripe;
  private razorpay: Razorpay;

  constructor(private prisma: PrismaService) {
    const stripeKey = process.env.STRIPE_SECRET_KEY || 'sk_test_mock_key';
    this.stripe = new Stripe(stripeKey, {
      apiVersion: '2023-10-16' as any,
    });

    const razorpayId = process.env.RAZORPAY_KEY_ID || 'rzp_test_mock_id';
    const razorpaySecret = process.env.RAZORPAY_KEY_SECRET || 'rzp_test_mock_secret';
    this.razorpay = new Razorpay({
      key_id: razorpayId,
      key_secret: razorpaySecret,
    });
  }

  async createPayment(
    userId: string,
    orderId: string,
    method: 'STRIPE' | 'RAZORPAY' | 'COD' | 'WALLET',
  ) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { user: true },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.userId !== userId) {
      throw new ForbiddenException('Not authorized for this order');
    }

    const amount = order.total;

    const existingPayment = await this.prisma.payment.findFirst({
      where: { orderId },
    });

    if (existingPayment && existingPayment.status === PaymentStatus.SUCCESSFUL) {
      throw new BadRequestException('Order has already been paid for');
    }

    // 1. WALLET METHOD
    if (method === 'WALLET') {
      const wallet = await this.prisma.wallet.findUnique({
        where: { userId },
      });

      if (!wallet || wallet.balance < amount) {
        throw new BadRequestException('Insufficient wallet balance');
      }

      await this.prisma.wallet.update({
        where: { userId },
        data: { balance: { decrement: amount } },
      });

      await this.prisma.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: WalletTransactionType.DEBIT,
          amount,
          description: `Paid for order ${orderId}`,
        },
      });

      const payment = await this.prisma.payment.create({
        data: {
          orderId,
          amount,
          method: PaymentMethod.WALLET,
          status: PaymentStatus.SUCCESSFUL,
          transactionReference: `wal_txn_${Date.now()}`,
        },
      });

      await this.prisma.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.ACCEPTED },
      });

      return { success: true, payment, redirectUrl: null };
    }

    // 2. CASH ON DELIVERY (COD)
    if (method === 'COD') {
      const payment = await this.prisma.payment.create({
        data: {
          orderId,
          amount,
          method: PaymentMethod.COD,
          status: PaymentStatus.PENDING,
          transactionReference: `cod_txn_${Date.now()}`,
        },
      });

      await this.prisma.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.ACCEPTED },
      });

      return { success: true, payment, redirectUrl: null };
    }

    // 3. STRIPE (CARD) METHOD
    if (method === 'STRIPE') {
      let sessionUrl = '';
      let txnRef = '';
      try {
        if (process.env.STRIPE_SECRET_KEY) {
          const session = await this.stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
              {
                price_data: {
                  currency: 'inr',
                  product_data: {
                    name: `SwiggyZone Order #${orderId}`,
                  },
                  unit_amount: Math.round(amount * 100),
                },
                quantity: 1,
              },
            ],
            mode: 'payment',
            success_url: `http://localhost:3000/orders?status=success&orderId=${orderId}`,
            cancel_url: `http://localhost:3000/orders?status=cancel`,
            client_reference_id: orderId,
          });
          sessionUrl = session.url || '';
          txnRef = session.id;
        } else {
          sessionUrl = `http://localhost:3000/orders?status=success&orderId=${orderId}&mock_stripe=true`;
          txnRef = `mock_stripe_${Date.now()}`;
        }
      } catch (err) {
        this.logger.error('Stripe session error, falling back', err);
        sessionUrl = `http://localhost:3000/orders?status=success&orderId=${orderId}&mock_stripe=true`;
        txnRef = `mock_stripe_${Date.now()}`;
      }

      const payment = await this.prisma.payment.create({
        data: {
          orderId,
          amount,
          method: PaymentMethod.CARD,
          status: PaymentStatus.PENDING,
          transactionReference: txnRef,
        },
      });

      return { success: true, payment, redirectUrl: sessionUrl };
    }

    // 4. RAZORPAY (UPI) METHOD
    if (method === 'RAZORPAY') {
      let rzpOrderId = '';
      try {
        if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
          const rzpOrder = await this.razorpay.orders.create({
            amount: Math.round(amount * 100),
            currency: 'INR',
            receipt: `rcpt_${orderId}`,
          });
          rzpOrderId = rzpOrder.id;
        } else {
          rzpOrderId = `mock_rzp_${Date.now()}`;
        }
      } catch (err) {
        this.logger.error('Razorpay order error, falling back', err);
        rzpOrderId = `mock_rzp_${Date.now()}`;
      }

      const payment = await this.prisma.payment.create({
        data: {
          orderId,
          amount,
          method: PaymentMethod.UPI,
          status: PaymentStatus.PENDING,
          transactionReference: rzpOrderId,
        },
      });

      return {
        success: true,
        payment,
        rzpOrderId,
        keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_mock_id',
        amount: Math.round(amount * 100),
      };
    }

    throw new BadRequestException('Invalid payment method selection');
  }

  async processRefund(paymentId: string, userId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: { order: true },
    });

    if (!payment) {
      throw new NotFoundException('Payment record not found');
    }

    if (payment.status !== PaymentStatus.SUCCESSFUL) {
      throw new BadRequestException('Only successful payments can be refunded');
    }

    if (payment.method === PaymentMethod.WALLET) {
      const wallet = await this.prisma.wallet.findUnique({
        where: { userId: payment.order.userId },
      });

      if (wallet) {
        await this.prisma.wallet.update({
          where: { userId: payment.order.userId },
          data: { balance: { increment: payment.amount } },
        });

        await this.prisma.walletTransaction.create({
          data: {
            walletId: wallet.id,
            type: WalletTransactionType.CREDIT,
            amount: payment.amount,
            description: `Refund for order ${payment.orderId}`,
          },
        });
      }
    } else if (payment.method === PaymentMethod.CARD && process.env.STRIPE_SECRET_KEY) {
      try {
        await this.stripe.refunds.create({
          payment_intent: payment.transactionReference || '',
        });
      } catch (err) {
        this.logger.warn(`Stripe API refund failed: ${err.message}`);
      }
    } else if (payment.method === PaymentMethod.UPI && process.env.RAZORPAY_KEY_ID) {
      try {
        await this.razorpay.payments.refund(payment.transactionReference || '', {
          amount: Math.round(payment.amount * 100),
        });
      } catch (err) {
        this.logger.warn(`Razorpay API refund failed: ${err.message}`);
      }
    }

    const updatedPayment = await this.prisma.payment.update({
      where: { id: paymentId },
      data: { status: PaymentStatus.REFUNDED },
    });

    await this.prisma.order.update({
      where: { id: payment.orderId },
      data: { status: OrderStatus.CANCELLED },
    });

    return { success: true, payment: updatedPayment };
  }

  async getPaymentHistory(userId: string) {
    return this.prisma.payment.findMany({
      where: {
        order: { userId },
      },
      include: {
        order: {
          select: {
            id: true,
            total: true,
            createdAt: true,
            restaurant: {
              select: { name: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async verifyAndProcessStripeWebhook(rawBody: Buffer, signature: string) {
    let event: Stripe.Event;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (webhookSecret && signature) {
      try {
        event = this.stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
      } catch (err) {
        this.logger.error(`Webhook Signature verification failed: ${err.message}`);
        throw new BadRequestException('Webhook signature validation failed');
      }
    } else {
      try {
        event = JSON.parse(rawBody.toString());
      } catch (err) {
        throw new BadRequestException('Invalid JSON payload');
      }
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const orderId = session.client_reference_id;

      if (orderId) {
        await this.completePayment(orderId, session.id);
      }
    }

    return { received: true };
  }

  async verifyAndProcessRazorpayWebhook(rawBody: Buffer, signature: string) {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (webhookSecret && signature) {
      const crypto = require('crypto');
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(rawBody)
        .digest('hex');

      if (expectedSignature !== signature) {
        this.logger.error('Razorpay Webhook signature verification failed');
        throw new BadRequestException('Signature mismatch');
      }
    }

    try {
      const payload = JSON.parse(rawBody.toString());
      const paymentId = payload.payload.payment.entity.id;
      const orderId = payload.payload.payment.entity.order_id;

      if (orderId) {
        const dbPayment = await this.prisma.payment.findFirst({
          where: { transactionReference: orderId },
        });

        if (dbPayment) {
          await this.completePayment(dbPayment.orderId, paymentId);
        }
      }
    } catch (err) {
      this.logger.error('Failed processing Razorpay webhook payload', err);
    }

    return { received: true };
  }

  async completePayment(orderId: string, txnRef: string) {
    await this.prisma.payment.updateMany({
      where: { orderId },
      data: {
        status: PaymentStatus.SUCCESSFUL,
        transactionReference: txnRef,
      },
    });

    await this.prisma.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.ACCEPTED },
    });
  }
}
