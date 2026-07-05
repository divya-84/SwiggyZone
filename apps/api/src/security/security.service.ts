import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import * as crypto from 'crypto';

@Injectable()
export class SecurityService {
  constructor(private prisma: PrismaService) {}

  private readonly algorithm = 'aes-256-gcm';
  private readonly secretKey = crypto.scryptSync('swiggyzone-aes-key-salt-phrase-2026', 'salt-2026', 32);

  // AES-256-GCM Text Encryption
  encrypt(text: string): { ciphertext: string; iv: string; tag: string } {
    try {
      const iv = crypto.randomBytes(12);
      const cipher = crypto.createCipheriv(this.algorithm, this.secretKey, iv);
      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      const tag = cipher.getAuthTag().toString('hex');

      return {
        ciphertext: encrypted,
        iv: iv.toString('hex'),
        tag,
      };
    } catch (err) {
      throw new BadRequestException('Encryption failed: ' + err.message);
    }
  }

  // AES-256-GCM Text Decryption
  decrypt(ciphertext: string, ivHex: string, tagHex: string): string {
    try {
      const iv = Buffer.from(ivHex, 'hex');
      const tag = Buffer.from(tagHex, 'hex');
      const decipher = crypto.createDecipheriv(this.algorithm, this.secretKey, iv);
      decipher.setAuthTag(tag);
      let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch (err) {
      throw new BadRequestException('Decryption failed: ' + err.message);
    }
  }

  // System Audit Logger
  async logSecurityAudit(userId: string | null, action: string) {
    return this.prisma.auditLog.create({
      data: {
        action,
        tableName: 'User',
        recordId: userId || 'SYSTEM',
        userId,
      },
    });
  }

  // Health and Uptime Monitor Dials
  async getSystemHealth() {
    let dbStatus = 'ONLINE';
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch (err) {
      dbStatus = 'OFFLINE';
    }

    const memoryUsage = process.memoryUsage();
    const heapUsedMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);
    const heapTotalMB = Math.round(memoryUsage.heapTotal / 1024 / 1024);

    const uptimeSeconds = Math.round(process.uptime());

    // CPU Usage simulation using process.cpuUsage
    const startUsage = process.cpuUsage();
    const now = Date.now();
    while (Date.now() - now < 5) {
      // Burn CPU for 5ms to get a reading
    }
    const endUsage = process.cpuUsage(startUsage);
    const totalCpuTime = (endUsage.user + endUsage.system) / 1000;
    const cpuPercent = Math.min(99, Math.max(1, Math.round((totalCpuTime / 5) * 100)));

    return {
      dbStatus,
      uptimeSeconds,
      cpuPercent,
      memory: {
        used: heapUsedMB,
        total: heapTotalMB,
      },
      headers: {
        contentSecurityPolicy: 'default-src \'self\'',
        xFrameOptions: 'SAMEORIGIN',
        xXSSProtection: '1; mode=block',
        strictTransportSecurity: 'max-age=15552000; includeSubDomains',
        xContentTypeOptions: 'nosniff',
      },
    };
  }
}
