import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class InvoiceService {
  constructor(private prisma: PrismaService) {}

  async generateInvoiceData(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            menuItem: true,
          },
        },
        restaurant: true,
        user: true,
        payment: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const subtotal = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const tax = subtotal * 0.05; // 5% GST
    const deliveryFee = 40;
    const discount = order.couponCode ? 50 : 0;

    return {
      orderId: order.id,
      date: order.createdAt,
      status: order.status,
      customer: {
        name: `${order.user.firstName} ${order.user.lastName}`,
        email: order.user.email,
        phone: order.user.phoneNumber || 'N/A',
      },
      restaurant: {
        name: order.restaurant.name,
        description: order.restaurant.description,
      },
      items: order.items.map((i) => ({
        name: i.menuItem.name,
        quantity: i.quantity,
        unitPrice: i.price,
        totalPrice: i.price * i.quantity,
      })),
      pricing: {
        subtotal,
        tax,
        deliveryFee,
        discount,
        total: order.total,
      },
      payment: order.payment
        ? {
            method: order.payment.method,
            transactionId: order.payment.transactionReference || 'N/A',
            status: order.payment.status,
          }
        : null,
    };
  }

  async generateHtmlInvoice(orderId: string): Promise<string> {
    const data = await this.generateInvoiceData(orderId);

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>SwiggyZone Invoice - ${data.orderId}</title>
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #1e293b; background: #0b0f19; margin: 0; padding: 20px; }
          .invoice-card { background: #111827; border: 1px solid #1f2937; max-width: 600px; margin: auto; padding: 30px; border-radius: 16px; box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1); }
          .header { display: flex; justify-content: space-between; border-bottom: 1px solid #1f2937; padding-bottom: 20px; margin-bottom: 20px; }
          .header h1 { color: #f97316; margin: 0; font-size: 24px; }
          .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; font-size: 12px; }
          .section-title { font-weight: bold; color: #94a3b8; text-transform: uppercase; margin-bottom: 6px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 12px; }
          th { text-align: left; padding: 8px; border-bottom: 2px solid #1f2937; color: #94a3b8; }
          td { padding: 8px; border-bottom: 1px solid #1f2937; color: #e2e8f0; }
          .totals { margin-left: auto; width: 250px; font-size: 12px; border-top: 2px solid #1f2937; padding-top: 10px; }
          .total-row { display: flex; justify-content: space-between; padding: 4px 0; }
          .grand-total { font-weight: bold; font-size: 14px; color: #f97316; margin-top: 6px; }
          .footer { text-align: center; font-size: 10px; color: #64748b; margin-top: 30px; border-top: 1px solid #1f2937; padding-top: 20px; }
        </style>
      </head>
      <body>
        <div class="invoice-card">
          <div class="header">
            <div>
              <h1>SwiggyZone Invoice</h1>
              <small style="color: #64748b;">Order ID: ${data.orderId}</small>
            </div>
            <div style="text-align: right; font-size: 12px; color: #e2e8f0;">
              <div>Date: ${new Date(data.date).toLocaleDateString()}</div>
              <div>Status: <strong style="color: #10b981;">${data.status}</strong></div>
            </div>
          </div>
          <div class="details-grid">
            <div>
              <div class="section-title">Merchant</div>
              <div style="color: #f8fafc; font-weight: bold;">${data.restaurant.name}</div>
              <div style="color: #94a3b8;">${data.restaurant.description}</div>
            </div>
            <div>
              <div class="section-title">Bill To</div>
              <div style="color: #f8fafc; font-weight: bold;">${data.customer.name}</div>
              <div style="color: #94a3b8;">Email: ${data.customer.email}</div>
              <div style="color: #94a3b8;">Phone: ${data.customer.phone}</div>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Qty</th>
                <th>Price</th>
                <th style="text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${data.items
                .map(
                  (i) => `
                <tr>
                  <td>${i.name}</td>
                  <td>${i.quantity}</td>
                  <td>₹${i.unitPrice}</td>
                  <td style="text-align: right;">₹${i.totalPrice}</td>
                </tr>
              `,
                )
                .join('')}
            </tbody>
          </table>
          <div class="totals">
            <div class="total-row"><span>Subtotal:</span><span>₹${data.pricing.subtotal.toFixed(2)}</span></div>
            <div class="total-row"><span>GST (5%):</span><span>₹${data.pricing.tax.toFixed(2)}</span></div>
            <div class="total-row"><span>Delivery Fee:</span><span>₹${data.pricing.deliveryFee.toFixed(2)}</span></div>
            ${
              data.pricing.discount > 0
                ? `<div class="total-row" style="color: #ef4444;"><span>Discount:</span><span>- ₹${data.pricing.discount.toFixed(2)}</span></div>`
                : ''
            }
            <div class="total-row grand-total"><span>Grand Total:</span><span>₹${data.pricing.total.toFixed(2)}</span></div>
          </div>
          <div class="footer">
            Thank you for ordering with SwiggyZone! For support, contact support@swiggyzone.com.
          </div>
        </div>
      </body>
      </html>
    `;
  }
}
