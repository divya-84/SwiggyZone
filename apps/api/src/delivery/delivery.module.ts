import { Module } from '@nestjs/common';
import { DeliveryController } from './delivery.controller';
import { DeliveryService } from './delivery.service';
import { PrismaService } from '../prisma.service';
import { RedisService } from '../redis.service';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [NotificationModule],
  controllers: [DeliveryController],
  providers: [DeliveryService, PrismaService, RedisService],
  exports: [DeliveryService],
})
export class DeliveryModule {}
