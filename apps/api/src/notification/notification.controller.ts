import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationService } from './notification.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '@prisma/client';

@ApiTags('Notification Operations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationController {
  constructor(private readonly service: NotificationService) {}

  @Get()
  @ApiOperation({ summary: 'Retrieve active notifications list for current user' })
  async getNotifications(@CurrentUser() user: User) {
    return this.service.getUserNotifications(user.id);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark a notification as read' })
  async markRead(@Param('id') id: string, @CurrentUser() user: User) {
    return this.service.markAsRead(id, user.id);
  }

  @Get('preferences')
  @ApiOperation({ summary: 'Get current user notification settings' })
  async getPreferences(@CurrentUser() user: User) {
    return this.service.getPreferences(user.id);
  }

  @Post('preferences')
  @ApiOperation({ summary: 'Update user notification settings' })
  async updatePreferences(@CurrentUser() user: User, @Body() body: any) {
    return this.service.updatePreferences(user.id, body);
  }

  @Get('queue/status')
  @ApiOperation({ summary: 'Fetch notification worker queue status and logs' })
  async getQueueStatus() {
    return this.service.getQueueStatus();
  }

  @Post('trigger')
  @ApiOperation({ summary: 'Enqueue a simulated test notification' })
  async triggerNotification(
    @CurrentUser() user: User,
    @Body('templateKey') templateKey: string,
    @Body('channels') channels: string[],
  ) {
    return this.service.triggerNotification(user.id, templateKey, channels);
  }
}
