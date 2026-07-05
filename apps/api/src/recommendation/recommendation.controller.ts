import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RecommendationService } from './recommendation.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '@prisma/client';

@ApiTags('Personalized Recommendations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('recommendations')
export class RecommendationController {
  constructor(private readonly service: RecommendationService) {}

  @Get()
  @ApiOperation({ summary: 'Retrieve custom dish recommendations matching user history, weather, location and time' })
  async getRecommendations(
    @CurrentUser() user: User,
    @Query('weather') weather?: string,
  ) {
    return this.service.getRecommendations(user.id, weather);
  }

  @Get('promotions')
  @ApiOperation({ summary: 'Recommend dynamic promotions using Demand, Weather, Inventory, Distance, Festival, and Traffic' })
  async getPromotions(
    @CurrentUser() user: User,
    @Query('demand') demand?: 'LOW' | 'MEDIUM' | 'HIGH',
    @Query('weather') weather?: 'SUNNY' | 'RAINY' | 'COLD' | 'HOT' | 'WINDY',
    @Query('traffic') traffic?: 'LOW' | 'MEDIUM' | 'HEAVY',
    @Query('festival') festival?: 'NONE' | 'DIWALI' | 'HOLI' | 'CHRISTMAS' | 'EID' | 'NEW_YEAR',
    @Query('distanceKm') distanceKm?: string,
  ) {
    const parsedDistance = distanceKm ? parseFloat(distanceKm) : 2.5;
    return this.service.getPromoRecommendations(
      user.id,
      demand || 'MEDIUM',
      weather || 'SUNNY',
      traffic || 'LOW',
      festival || 'NONE',
      parsedDistance,
    );
  }
}
