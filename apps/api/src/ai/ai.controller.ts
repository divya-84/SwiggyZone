import { Controller, Post, Delete, Body, UseGuards, UseInterceptors, UploadedFile } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { User } from '@prisma/client';

@ApiTags('AI Food Assistant')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('ai')
export class AiController {
  constructor(private readonly service: AiService) {}

  @Post('chat')
  @ApiOperation({ summary: 'Submit user query to OpenAI food assistant' })
  async chat(
    @CurrentUser() user: User,
    @Body('prompt') prompt: string,
  ) {
    return this.service.chat(user.id, prompt);
  }

  @Delete('memory')
  @ApiOperation({ summary: 'Reset AI conversation session memory' })
  async clearMemory(@CurrentUser() user: User) {
    return this.service.clearMemory(user.id);
  }

  @Post('recognize-food')
  @UseInterceptors(FileInterceptor('image'))
  @ApiOperation({ summary: 'Upload and identify dish contents from photo vision' })
  async recognizeFood(
    @UploadedFile() file: any,
  ) {
    return this.service.recognizeFood(file.buffer, file.originalname);
  }
}
