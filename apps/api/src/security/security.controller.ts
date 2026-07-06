import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SecurityService } from './security.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRoleName } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '@prisma/client';

@ApiTags('Security & Monitoring Operations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('security')
export class SecurityController {
  constructor(private readonly service: SecurityService) {}

  @Get('health')
  @UseGuards(RolesGuard)
  @Roles(UserRoleName.ADMIN)
  @ApiOperation({
    summary: 'Retrieve system telemetry, uptime, memory, and database connection status',
  })
  async getHealth() {
    return this.service.getSystemHealth();
  }

  @Post('encrypt')
  @ApiOperation({ summary: 'Encrypt text data via AES-256-GCM sandbox' })
  encryptData(@Body('text') text: string) {
    return this.service.encrypt(text);
  }

  @Post('decrypt')
  @ApiOperation({ summary: 'Decrypt cipher text data via AES-256-GCM sandbox' })
  decryptData(
    @Body('ciphertext') ciphertext: string,
    @Body('iv') iv: string,
    @Body('tag') tag: string,
  ) {
    return this.service.decrypt(ciphertext, iv, tag);
  }

  @Post('audit')
  @ApiOperation({ summary: 'Log a simulated security audit log' })
  async createAuditLog(@CurrentUser() user: User, @Body('action') action: string) {
    return this.service.logSecurityAudit(user.id, action);
  }
}
