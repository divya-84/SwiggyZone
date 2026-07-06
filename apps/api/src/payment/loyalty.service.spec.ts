import { Test, TestingModule } from '@nestjs/testing';
import { LoyaltyService } from './loyalty.service';
import { PrismaService } from '../prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('LoyaltyService Unit Tests', () => {
  let service: LoyaltyService;
  let prisma: PrismaService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
    },
    wallet: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoyaltyService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<LoyaltyService>(LoyaltyService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should throw NotFoundException if user does not exist', async () => {
    mockPrismaService.user.findUnique.mockResolvedValue(null);

    await expect(service.getOrCreateProfile('invalid-id')).rejects.toThrow(NotFoundException);
  });

  it('should calculate Bronze tier progress if points are 0', async () => {
    const mockUser = {
      id: 'user-1',
      firstName: 'Ramesh',
      roleName: 'CUSTOMER',
    };
    const mockWallet = {
      id: 'wallet-1',
      userId: 'user-1',
      balance: 100.0,
      transactions: [],
    };

    mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
    mockPrismaService.wallet.findUnique.mockResolvedValue(mockWallet);

    // Set points manually
    (service as any).pointsStore['user-1'] = 50;

    const profile = await service.getOrCreateProfile('user-1');
    expect(profile.tier).toBe('BRONZE');
    expect(profile.cashbackRate).toBe(0.02);
    expect(profile.progressToNext).toBe(50); // 50 / 100 threshold
  });

  it('should calculate Silver tier progress correctly', async () => {
    const mockUser = {
      id: 'user-1',
      firstName: 'Ramesh',
      roleName: 'CUSTOMER',
    };
    const mockWallet = {
      id: 'wallet-1',
      userId: 'user-1',
      balance: 100.0,
      transactions: [],
    };

    mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
    mockPrismaService.wallet.findUnique.mockResolvedValue(mockWallet);

    (service as any).pointsStore['user-1'] = 150;

    const profile = await service.getOrCreateProfile('user-1');
    expect(profile.tier).toBe('SILVER');
    expect(profile.cashbackRate).toBe(0.05);
    expect(profile.progressToNext).toBe(50); // 150 / 300 threshold
  });
});
