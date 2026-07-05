import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRoleName } from '@prisma/client';

@ApiTags('Platform Administration')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRoleName.ADMIN)
@Controller('admin')
export class AdminController {
  constructor(private readonly service: AdminService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Retrieve gross sales, active orders, and platform revenue details' })
  async getStats() {
    return this.service.getStats();
  }

  @Get('users')
  @ApiOperation({ summary: 'List platform users registered' })
  async getUsers() {
    return this.service.getUsers();
  }

  @Patch('users/:id/role')
  @ApiOperation({ summary: 'Modify user access role' })
  async updateRole(
    @Param('id') id: string,
    @Body('role') role: UserRoleName,
  ) {
    return this.service.updateUserRole(id, role);
  }

  @Get('restaurants')
  @ApiOperation({ summary: 'List platform restaurant listings' })
  async getRestaurants() {
    return this.service.getRestaurants();
  }

  @Patch('restaurants/:id/toggle')
  @ApiOperation({ summary: 'Toggle restaurant active state' })
  async toggleRestaurant(@Param('id') id: string) {
    return this.service.toggleRestaurantActive(id);
  }

  @Get('orders')
  @ApiOperation({ summary: 'List platform order transactions log' })
  async getOrders() {
    return this.service.getOrders();
  }

  @Get('delivery')
  @ApiOperation({ summary: 'List platform registered delivery riders' })
  async getDeliveryPartners() {
    return this.service.getDeliveryPartners();
  }

  @Post('coupons')
  @ApiOperation({ summary: 'Create and dispatch promotional discount coupons' })
  async createCoupon(
    @Body()
    dto: {
      code: string;
      description: string;
      discountType: 'PERCENTAGE' | 'FLAT';
      discountValue: number;
      minOrderValue?: number;
      maxUses?: number;
      expiresAt: string;
    },
  ) {
    return this.service.createCoupon(dto);
  }

  @Get('coupons')
  @ApiOperation({ summary: 'List platform discount coupons' })
  async getCoupons() {
    return this.service.getCoupons();
  }

  @Get('logs')
  @ApiOperation({ summary: 'List system database audit logs' })
  async getLogs() {
    return this.service.getAuditLogs();
  }

  @Get('analytics')
  @ApiOperation({ summary: 'Retrieve custom customer, restaurant, sales, and AI analytics' })
  async getAnalytics() {
    return this.service.getAnalyticsData();
  }

  @Post('testing/run-suite')
  @ApiOperation({ summary: 'Execute testing suites (Unit, Integration, E2E)' })
  runTestSuite(@Body('type') type: 'unit' | 'integration' | 'e2e' | 'performance') {
    return this.service.runTestSuite(type);
  }

  @Post('testing/load-test')
  @ApiOperation({ summary: 'Execute real DB concurrent load test benchmark' })
  async executeLoadTest(
    @Body('endpoint') endpoint: string,
    @Body('concurrency') concurrency: number,
  ) {
    return this.service.executeLoadTest(endpoint, concurrency);
  }

  @Post('devops/terraform-plan')
  @ApiOperation({ summary: 'Execute Terraform plan simulation' })
  runTerraformPlan() {
    return this.service.runTerraformPlan();
  }

  @Get('fraud/alerts')
  @ApiOperation({ summary: 'Retrieve system fraud stats and alerts' })
  async getFraudAlerts() {
    return this.service.getFraudDetails();
  }

  @Post('fraud/simulate')
  @ApiOperation({ summary: 'Simulate a fraud vector attack' })
  async simulateFraud(@Body('category') category: string) {
    return this.service.simulateFraud(category);
  }

  @Post('fraud/block/:id')
  @ApiOperation({ summary: 'Deactivate / Block flagged user profile' })
  async blockFraudUser(@Param('id') id: string) {
    return this.service.blockFraudUser(id);
  }

  @Post('fraud/dismiss/:id')
  @ApiOperation({ summary: 'Dismiss fraud alert from active logs' })
  async dismissFraudAlert(@Param('id') id: string) {
    return this.service.dismissFraudAlert(id);
  }
}
