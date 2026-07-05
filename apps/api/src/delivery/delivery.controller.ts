import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DeliveryService } from './delivery.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User, UserRoleName } from '@prisma/client';

@ApiTags('Delivery Courier Operations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRoleName.DELIVERY_PARTNER, UserRoleName.ADMIN)
@Controller('delivery')
export class DeliveryController {
  constructor(private readonly service: DeliveryService) {}

  @Get('profile')
  @ApiOperation({ summary: 'Retrieve dashboard analytics and courier details' })
  async getProfile(@CurrentUser() user: User) {
    return this.service.getAnalytics(user.id);
  }

  @Post('toggle-active')
  @ApiOperation({ summary: 'Toggle shift active online status' })
  async toggleActive(@CurrentUser() user: User) {
    return this.service.toggleActive(user.id);
  }

  @Get('orders/available')
  @ApiOperation({ summary: 'List unclaimed ready delivery orders' })
  async getAvailable() {
    return this.service.getAvailableOrders();
  }

  @Post('orders/:id/accept')
  @ApiOperation({ summary: 'Claim order for delivery route assignment' })
  async acceptOrder(@Param('id') id: string, @CurrentUser() user: User) {
    return this.service.acceptOrder(id, user.id);
  }

  @Post('orders/:id/complete')
  @ApiOperation({ summary: 'Verify OTP and mark order as delivered' })
  async completeOrder(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body('otp') otp: string,
  ) {
    return this.service.completeOrder(id, otp, user.id);
  }

  @Get('history')
  @ApiOperation({ summary: 'List completed delivery jobs log' })
  async getHistory(@CurrentUser() user: User) {
    return this.service.getHistory(user.id);
  }

  @Get('optimize')
  @ApiOperation({ summary: 'Run AI Delivery Optimization simulation' })
  async optimizeDeliveries(
    @CurrentUser() user: User,
    @Query('traffic') traffic?: 'LOW' | 'MEDIUM' | 'HEAVY',
    @Query('weather') weather?: 'SUNNY' | 'RAINY' | 'COLD',
    @Query('enableBatching') enableBatching?: string,
  ) {
    const isBatchingEnabled = enableBatching === 'true';
    return this.service.optimizeDeliveries(
      user.id,
      traffic || 'LOW',
      weather || 'SUNNY',
      isBatchingEnabled,
    );
  }
}
