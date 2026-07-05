import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RestaurantService } from './restaurant.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User, UserRoleName } from '@prisma/client';

@ApiTags('Restaurant Partner Operations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRoleName.RESTAURANT_OWNER, UserRoleName.ADMIN)
@Controller('restaurants')
export class RestaurantController {
  constructor(private readonly service: RestaurantService) {}

  @Post('onboard')
  @ApiOperation({ summary: 'Onboard a new partner restaurant' })
  async onboard(
    @CurrentUser() user: User,
    @Body()
    dto: {
      name: string;
      description: string;
      coverImage: string;
      costForTwo: number;
      latitude: number;
      longitude: number;
      openingHour?: string;
      closingHour?: string;
    },
  ) {
    return this.service.onboard(user.id, dto);
  }

  @Get('my-restaurant')
  @ApiOperation({ summary: 'Retrieve owned restaurant configuration, categories, and inventory' })
  async getMyRestaurant(@CurrentUser() user: User) {
    return this.service.getRestaurantByOwner(user.id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Toggle restaurant online status' })
  async updateStatus(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body('isActive') isActive: boolean,
  ) {
    return this.service.updateStatus(id, user.id, isActive);
  }

  @Post(':id/category')
  @ApiOperation({ summary: 'Add a new category folder to menu' })
  async createCategory(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body('name') name: string,
  ) {
    return this.service.createCategory(id, user.id, name);
  }

  @Post('category/:categoryId/item')
  @ApiOperation({ summary: 'Create a new food item inside a category' })
  async createMenuItem(
    @Param('categoryId') categoryId: string,
    @CurrentUser() user: User,
    @Body()
    dto: {
      name: string;
      description: string;
      price: number;
      image?: string;
      isVeg: boolean;
      calories: number;
      protein?: number;
      carbohydrates?: number;
      fats?: number;
      initialStock?: number;
    },
  ) {
    return this.service.createMenuItem(categoryId, user.id, dto);
  }

  @Patch('item/:itemId')
  @ApiOperation({ summary: 'Update menu item details (price, description, availability)' })
  async updateMenuItem(
    @Param('itemId') itemId: string,
    @CurrentUser() user: User,
    @Body()
    dto: {
      name?: string;
      description?: string;
      price?: number;
      isAvailable?: boolean;
      isVeg?: boolean;
    },
  ) {
    return this.service.updateMenuItem(itemId, user.id, dto);
  }

  @Delete('item/:itemId')
  @ApiOperation({ summary: 'Remove item from category menu' })
  async deleteMenuItem(@Param('itemId') itemId: string, @CurrentUser() user: User) {
    return this.service.deleteMenuItem(itemId, user.id);
  }

  @Patch('item/:itemId/inventory')
  @ApiOperation({ summary: 'Update item inventory stock counts' })
  async updateInventory(
    @Param('itemId') itemId: string,
    @CurrentUser() user: User,
    @Body('quantity', ParseIntPipe) quantity: number,
  ) {
    return this.service.updateInventory(itemId, user.id, quantity);
  }

  @Get(':id/analytics')
  @ApiOperation({ summary: 'Fetch restaurant sales metrics and popular dish rankings' })
  async getAnalytics(@Param('id') id: string, @CurrentUser() user: User) {
    return this.service.getAnalytics(id, user.id);
  }
}
