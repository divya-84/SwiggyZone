import { Module } from '@nestjs/common';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { InvoiceService } from './invoice.service';
import { PrismaService } from '../prisma.service';
import { LoyaltyController } from './loyalty.controller';
import { LoyaltyService } from './loyalty.service';

@Module({
  controllers: [PaymentController, LoyaltyController],
  providers: [PaymentService, InvoiceService, PrismaService, LoyaltyService],
  exports: [PaymentService, InvoiceService, LoyaltyService],
})
export class PaymentModule {}
