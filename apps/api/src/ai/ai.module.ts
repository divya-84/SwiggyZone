import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { PrismaService } from '../prisma.service';
import { RedisService } from '../redis.service';

@Module({
  controllers: [AiController],
  providers: [AiService, PrismaService, RedisService],
  exports: [AiService],
})
export class AiModule {}
