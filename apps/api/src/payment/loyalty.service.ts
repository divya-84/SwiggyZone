import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { WalletTransactionType } from '@prisma/client';

@Injectable()
export class LoyaltyService {
  constructor(private prisma: PrismaService) {}

  private pointsStore: Record<string, number> = {};
  private referrals: Record<string, { code: string; referred: string[] }> = {};

  async getOrCreateProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) throw new NotFoundException('User not found');

    // Default points initialization (Silver Tier start)
    if (this.pointsStore[userId] === undefined) {
      this.pointsStore[userId] = 150;
    }

    // Default referral code initialization
    if (!this.referrals[userId]) {
      const code = `REF-${user.firstName.toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;
      this.referrals[userId] = { code, referred: [] };
    }

    const points = this.pointsStore[userId];

    // Membership Tier Calculations
    let tier: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM' = 'BRONZE';
    let cashbackRate = 0.02; // 2%
    let nextTier: 'SILVER' | 'GOLD' | 'PLATINUM' | 'MAX' = 'SILVER';
    let nextTierThreshold = 100;

    if (points >= 800) {
      tier = 'PLATINUM';
      cashbackRate = 0.15; // 15%
      nextTier = 'MAX';
      nextTierThreshold = 800;
    } else if (points >= 300) {
      tier = 'GOLD';
      cashbackRate = 0.1; // 10%
      nextTier = 'PLATINUM';
      nextTierThreshold = 800;
    } else if (points >= 100) {
      tier = 'SILVER';
      cashbackRate = 0.05; // 5%
      nextTier = 'GOLD';
      nextTierThreshold = 300;
    } else {
      tier = 'BRONZE';
      cashbackRate = 0.02; // 2%
      nextTier = 'SILVER';
      nextTierThreshold = 100;
    }

    const progressToNext =
      nextTier === 'MAX' ? 100 : Math.min(100, Math.round((points / nextTierThreshold) * 100));

    // Get database wallet
    let wallet = await this.prisma.wallet.findUnique({
      where: { userId },
      include: { transactions: { orderBy: { createdAt: 'desc' } } },
    });

    if (!wallet) {
      wallet = await this.prisma.wallet.create({
        data: { userId, balance: 250.0 }, // default starting balance
        include: { transactions: true },
      });
    }

    return {
      userId,
      points,
      tier,
      cashbackRate,
      nextTier,
      nextTierThreshold,
      progressToNext,
      referrals: this.referrals[userId],
      walletBalance: wallet.balance,
      transactions: wallet.transactions.slice(0, 10),
      rewardsCatalog: [
        {
          id: 'reward-1',
          title: '₹100 Wallet Credit',
          cost: 100,
          desc: 'Adds ₹100 instantly to SwiggyZone wallet ledger.',
        },
        {
          id: 'reward-2',
          title: 'Free Delivery Voucher',
          cost: 80,
          desc: 'Waives delivery fee on your next 3 checkouts.',
        },
        {
          id: 'reward-3',
          title: 'Free Saffron Chicken Biryani',
          cost: 250,
          desc: 'Claim a coupon for a free signature chicken biryani dish.',
        },
      ],
    };
  }

  async addWalletFunds(userId: string, amount: number) {
    if (amount <= 0) throw new BadRequestException('Amount must be positive');

    let wallet = await this.prisma.wallet.findUnique({
      where: { userId },
    });

    if (!wallet) {
      wallet = await this.prisma.wallet.create({
        data: { userId, balance: 0.0 },
      });
    }

    const updated = await this.prisma.wallet.update({
      where: { id: wallet.id },
      data: { balance: { increment: amount } },
    });

    await this.prisma.walletTransaction.create({
      data: {
        walletId: wallet.id,
        amount,
        type: WalletTransactionType.CREDIT,
        description: 'Deposited funds via simulated card top-up',
      },
    });

    return this.getOrCreateProfile(userId);
  }

  async claimReward(userId: string, rewardId: string) {
    const profile = await this.getOrCreateProfile(userId);
    const costMap: Record<string, number> = {
      'reward-1': 100,
      'reward-2': 80,
      'reward-3': 250,
    };

    const cost = costMap[rewardId];
    if (!cost) throw new BadRequestException('Invalid reward ID');

    if (profile.points < cost) {
      throw new BadRequestException('Insufficient loyalty points balance');
    }

    // Deduct points
    this.pointsStore[userId] -= cost;

    // Credit reward benefit
    if (rewardId === 'reward-1') {
      let wallet = await this.prisma.wallet.findUnique({ where: { userId } });
      await this.prisma.wallet.update({
        where: { id: wallet.id },
        data: { balance: { increment: 100.0 } },
      });
      await this.prisma.walletTransaction.create({
        data: {
          walletId: wallet.id,
          amount: 100.0,
          type: WalletTransactionType.CREDIT,
          description: 'Redeemed 100 loyalty points for wallet cash',
        },
      });
    }

    return this.getOrCreateProfile(userId);
  }

  async redeemReferral(userId: string, code: string) {
    const trimmed = code.toUpperCase().trim();
    if (!trimmed.startsWith('REF-')) {
      throw new BadRequestException('Invalid referral code format');
    }

    const profile = await this.getOrCreateProfile(userId);

    // Self referral check
    if (this.referrals[userId]?.code === trimmed) {
      throw new BadRequestException('Cannot redeem your own invite code');
    }

    // Find referrer in-memory
    let referrerId: string | null = null;
    for (const [uid, refObj] of Object.entries(this.referrals)) {
      if (refObj.code === trimmed) {
        referrerId = uid;
        break;
      }
    }

    if (!referrerId) {
      throw new NotFoundException('Referral code not registered');
    }

    // Record referred friend
    this.referrals[referrerId].referred.push(profile.userId);

    // Credit ₹100 sign-up bonus to referrer wallet
    let refWallet = await this.prisma.wallet.findUnique({ where: { userId: referrerId } });
    if (refWallet) {
      await this.prisma.wallet.update({
        where: { id: refWallet.id },
        data: { balance: { increment: 100.0 } },
      });
      await this.prisma.walletTransaction.create({
        data: {
          walletId: refWallet.id,
          amount: 100.0,
          type: WalletTransactionType.CREDIT,
          description: `Referral signup bonus for inviting friend.`,
        },
      });
    }

    // Credit ₹100 sign-up bonus to referee wallet
    let refereeWallet = await this.prisma.wallet.findUnique({ where: { userId } });
    if (refereeWallet) {
      await this.prisma.wallet.update({
        where: { id: refereeWallet.id },
        data: { balance: { increment: 100.0 } },
      });
      await this.prisma.walletTransaction.create({
        data: {
          walletId: refereeWallet.id,
          amount: 100.0,
          type: WalletTransactionType.CREDIT,
          description: 'Referral reward credit applied.',
        },
      });
    }

    return this.getOrCreateProfile(userId);
  }

  async simulateOrder(userId: string, orderAmount: number) {
    const profile = await this.getOrCreateProfile(userId);

    // Earn points: 1 point per 10 INR spent
    const earnedPoints = Math.round(orderAmount / 10);
    this.pointsStore[userId] += earnedPoints;

    // Earn Cashback: based on active tier rate
    const earnedCashback = Math.round(orderAmount * profile.cashbackRate);

    if (earnedCashback > 0) {
      let wallet = await this.prisma.wallet.findUnique({ where: { userId } });
      await this.prisma.wallet.update({
        where: { id: wallet.id },
        data: { balance: { increment: earnedCashback } },
      });
      await this.prisma.walletTransaction.create({
        data: {
          walletId: wallet.id,
          amount: earnedCashback,
          type: WalletTransactionType.CREDIT,
          description: `Earned ${Math.round(profile.cashbackRate * 100)}% tier cashback from order checkout`,
        },
      });
    }

    return this.getOrCreateProfile(userId);
  }
}
