import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { LoyaltyService } from './loyalty.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '@prisma/client';

@ApiTags('Loyalty & Wallet Operations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('loyalty')
export class LoyaltyController {
  constructor(private readonly service: LoyaltyService) {}

  @Get('profile')
  @ApiOperation({ summary: 'Retrieve customer loyalty profile, VIP tier, points, and wallet balance' })
  async getProfile(@CurrentUser() user: User) {
    return this.service.getOrCreateProfile(user.id);
  }

  @Post('wallet/add')
  @ApiOperation({ summary: 'Top-up wallet balance funds' })
  async addWalletFunds(
    @CurrentUser() user: User,
    @Body('amount') amount: number,
  ) {
    return this.service.addWalletFunds(user.id, amount);
  }

  @Post('rewards/claim')
  @ApiOperation({ summary: 'Redeem loyalty points for catalog reward voucher' })
  async claimReward(
    @CurrentUser() user: User,
    @Body('rewardId') rewardId: string,
  ) {
    return this.service.claimReward(user.id, rewardId);
  }

  @Post('referral/redeem')
  @ApiOperation({ summary: 'Redeem friend referral invite code' })
  async redeemReferral(
    @CurrentUser() user: User,
    @Body('code') code: string,
  ) {
    return this.service.redeemReferral(user.id, code);
  }

  @Post('simulate/order')
  @ApiOperation({ summary: 'Simulate order purchase to earn points and cashback' })
  async simulateOrder(
    @CurrentUser() user: User,
    @Body('amount') amount: number,
  ) {
    return this.service.simulateOrder(user.id, amount);
  }
}
