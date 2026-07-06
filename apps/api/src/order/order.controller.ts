import { Controller, Post, Get, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { OrderService } from './order.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User, OrderStatus, UserRoleName } from '@prisma/client';

@ApiTags('Order Lifecycle Operations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('orders')
export class OrderController {
  constructor(private readonly service: OrderService) {}

  @Post()
  @ApiOperation({ summary: 'Submit a new checkout cart order' })
  async create(
    @CurrentUser() user: User,
    @Body()
    dto: {
      restaurantId: string;
      addressId: string;
      couponCode?: string;
      notes?: string;
      items: { menuItemId: string; quantity: number }[];
    },
  ) {
    return this.service.createOrder(user.id, dto);
  }

  @Get('customer')
  @ApiOperation({ summary: 'Retrieve order history for current customer' })
  async getCustomerOrders(@CurrentUser() user: User) {
    return this.service.getCustomerOrders(user.id);
  }

  @Get('restaurant/:restaurantId')
  @UseGuards(RolesGuard)
  @Roles(UserRoleName.RESTAURANT_OWNER, UserRoleName.ADMIN)
  @ApiOperation({ summary: 'Retrieve order queue for restaurant manager' })
  async getRestaurantOrders(
    @Param('restaurantId') restaurantId: string,
    @CurrentUser() user: User,
  ) {
    return this.service.getRestaurantOrders(restaurantId, user.id);
  }

  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @Roles(UserRoleName.RESTAURANT_OWNER, UserRoleName.DELIVERY_PARTNER, UserRoleName.ADMIN)
  @ApiOperation({ summary: 'Update order lifecycle step status' })
  async updateStatus(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body('status') status: OrderStatus,
  ) {
    return this.service.updateOrderStatus(id, status, user.id, user.roleName as UserRoleName);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel order and request payment refunds' })
  async cancel(@Param('id') id: string, @CurrentUser() user: User) {
    return this.service.cancelOrder(id, user.id);
  }
}
