import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { RedisService } from '../redis.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RequestOtpDto, VerifyOtpDto } from './dto/otp.dto';
import { GoogleLoginDto } from './dto/google.dto';
import { User, UserRoleName } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    if (dto.phoneNumber) {
      const phoneExisting = await this.prisma.user.findUnique({
        where: { phoneNumber: dto.phoneNumber },
      });
      if (phoneExisting) {
        throw new ConflictException('Phone number already registered');
      }
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phoneNumber: dto.phoneNumber,
        roleName: dto.role,
        isVerified: false,
      },
    });

    // Create wallet for Customer
    if (user.roleName === UserRoleName.CUSTOMER) {
      await this.prisma.wallet.create({
        data: {
          userId: user.id,
          balance: 0.0,
        },
      });
    }

    return this.generateTokenPair(user);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.generateTokenPair(user);
  }

  async refreshTokens(refreshToken: string) {
    try {
      const secret = this.configService.get<string>(
        'JWT_REFRESH_SECRET',
        'refresh-secret-key-54321',
      );
      const payload = this.jwtService.verify(refreshToken, { secret });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      return this.generateTokenPair(user);
    } catch (err) {
      this.logger.error('Token refresh failed', err);
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  // OTP Login Simulation
  async requestOtp(dto: RequestOtpDto) {
    // Generate 6 digit code
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store in Redis (key: "otp:phone", TTL: 300s)
    const redisKey = `otp:${dto.phoneNumber}`;
    await this.redis.set(redisKey, otp, 300);

    this.logger.log(`[SMS SIMULATION] Sent OTP code: ${otp} to phone: ${dto.phoneNumber}`);
    return {
      message: 'OTP sent successfully (Simulated)',
      phoneNumber: dto.phoneNumber,
      // Exposed for testing in offline/dev envs:
      debugCode: otp,
    };
  }

  async verifyOtp(dto: VerifyOtpDto) {
    const redisKey = `otp:${dto.phoneNumber}`;
    const savedOtp = await this.redis.get(redisKey);

    if (!savedOtp || savedOtp !== dto.otpCode) {
      throw new BadRequestException('Invalid or expired OTP');
    }

    // Delete OTP from cache after use
    await this.redis.del(redisKey);

    // Look up or auto-register user
    let user = await this.prisma.user.findUnique({
      where: { phoneNumber: dto.phoneNumber },
    });

    if (!user) {
      // Auto-register Customer
      const tempEmail = `phone_${Date.now()}@swiggyzone.com`;
      const tempPasswordHash = await bcrypt.hash(`otp_pass_${Date.now()}`, 10);
      user = await this.prisma.user.create({
        data: {
          email: tempEmail,
          passwordHash: tempPasswordHash,
          firstName: 'Guest',
          lastName: 'User',
          phoneNumber: dto.phoneNumber,
          roleName: UserRoleName.CUSTOMER,
          isVerified: true,
        },
      });

      await this.prisma.wallet.create({
        data: {
          userId: user.id,
          balance: 0.0,
        },
      });
    }

    return this.generateTokenPair(user);
  }

  // Google OAuth Token Mocking
  async googleLogin(dto: GoogleLoginDto) {
    // In production, verify the token using google-auth-library.
    // For local testing, we extract values or create a mock account.
    this.logger.log(`Validating Google Sign-In with token prefix: ${dto.idToken.substring(0, 15)}`);

    // Mock user details decoded from Google token
    const mockGoogleEmail = 'googleuser@gmail.com';
    const mockFirstName = 'Google';
    const mockLastName = 'User';

    let user = await this.prisma.user.findUnique({
      where: { email: mockGoogleEmail },
    });

    if (!user) {
      const passwordHash = await bcrypt.hash(`google_oauth_${Date.now()}`, 10);
      user = await this.prisma.user.create({
        data: {
          email: mockGoogleEmail,
          passwordHash,
          firstName: mockFirstName,
          lastName: mockLastName,
          isVerified: true,
          roleName: UserRoleName.CUSTOMER,
        },
      });

      await this.prisma.wallet.create({
        data: {
          userId: user.id,
          balance: 0.0,
        },
      });
    }

    return this.generateTokenPair(user);
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Return success regardless to prevent user enumeration security issues
      return { message: 'Reset link dispatched if email exists.' };
    }

    const resetToken = Math.random().toString(36).substring(2, 15);
    const expires = new Date(Date.now() + 3600000); // 1 hour

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpires: expires,
      },
    });

    this.logger.log(
      `[EMAIL SIMULATION] Reset password link: http://localhost:3000/reset-password?token=${resetToken}`,
    );
    return {
      message: 'Reset link dispatched if email exists.',
      debugToken: resetToken,
    };
  }

  private async generateTokenPair(user: User) {
    const payload = { sub: user.id, email: user.email, role: user.roleName };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_ACCESS_SECRET', 'access-secret-key-12345'),
      expiresIn: '15m',
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET', 'refresh-secret-key-54321'),
      expiresIn: '7d',
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phoneNumber: user.phoneNumber,
        roleName: user.roleName,
      },
      accessToken,
      refreshToken,
    };
  }
}
