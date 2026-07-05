import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Headers,
  UseGuards,
  Req,
  Res,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentService } from './payment.service';
import { InvoiceService } from './invoice.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '@prisma/client';
import { Request, Response } from 'express';

interface RawBodyRequest extends Request {
  rawBody?: Buffer;
}

@ApiTags('Payment & Webhook Operations')
@Controller('payments')
export class PaymentController {
  constructor(
    private readonly paymentService: PaymentService,
    private readonly invoiceService: InvoiceService,
  ) {}

  @Post('checkout')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Initiate a payment session for an order' })
  async checkout(
    @CurrentUser() user: User,
    @Body()
    dto: {
      orderId: string;
      method: 'STRIPE' | 'RAZORPAY' | 'COD' | 'WALLET';
    },
  ) {
    return this.paymentService.createPayment(user.id, dto.orderId, dto.method);
  }

  @Post('refund/:paymentId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Refund a completed payment session' })
  async refund(@CurrentUser() user: User, @Param('paymentId') paymentId: string) {
    return this.paymentService.processRefund(paymentId, user.id);
  }

  @Get('history')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get payment transaction logs for current user' })
  async getHistory(@CurrentUser() user: User) {
    return this.paymentService.getPaymentHistory(user.id);
  }

  @Get('invoice/:orderId')
  @ApiOperation({ summary: 'Retrieve and print dynamic HTML invoice' })
  async getInvoice(@Param('orderId') orderId: string, @Res() res: Response) {
    const html = await this.invoiceService.generateHtmlInvoice(orderId);
    res.setHeader('Content-Type', 'text/html');
    return res.status(HttpStatus.OK).send(html);
  }

  @Post('webhook/stripe')
  @ApiOperation({ summary: 'Stripe webhook listener' })
  async handleStripeWebhook(
    @Headers('stripe-signature') signature: string,
    @Req() req: RawBodyRequest,
  ) {
    const rawBody = req.rawBody || Buffer.from('');
    return this.paymentService.verifyAndProcessStripeWebhook(rawBody, signature);
  }

  @Post('webhook/razorpay')
  @ApiOperation({ summary: 'Razorpay webhook listener' })
  async handleRazorpayWebhook(
    @Headers('x-razorpay-signature') signature: string,
    @Req() req: RawBodyRequest,
  ) {
    const rawBody = req.rawBody || Buffer.from('');
    return this.paymentService.verifyAndProcessRazorpayWebhook(rawBody, signature);
  }
}
