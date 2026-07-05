import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { PrismaService } from './prisma.service';
import { RedisService } from './redis.service';
import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { SearchModule } from './search/search.module';
import { RestaurantModule } from './restaurant/restaurant.module';
import { PaymentModule } from './payment/payment.module';
import { OrderModule } from './order/order.module';
import { NotificationModule } from './notification/notification.module';
import { GatewayModule } from './gateway/gateway.module';
import { DeliveryModule } from './delivery/delivery.module';
import { AdminModule } from './admin/admin.module';
import { AiModule } from './ai/ai.module';
import { RecommendationModule } from './recommendation/recommendation.module';
import { SecurityModule } from './security/security.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100,
    }]),
    AuthModule,
    SearchModule,
    RestaurantModule,
    PaymentModule,
    OrderModule,
    NotificationModule,
    GatewayModule,
    DeliveryModule,
    AdminModule,
    AiModule,
    RecommendationModule,
    SecurityModule,
  ],
  controllers: [AppController],
  providers: [
    PrismaService,
    RedisService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
