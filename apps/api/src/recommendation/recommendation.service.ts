import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { OrderStatus, DiscountType } from '@prisma/client';

@Injectable()
export class RecommendationService {
  constructor(private prisma: PrismaService) {}

  async getRecommendations(userId: string, weather: string = 'SUNNY') {
    // 1. Fetch user's order history for personalization
    const pastOrders = await this.prisma.order.findMany({
      where: { userId },
      include: {
        items: {
          include: { menuItem: true },
        },
      },
      take: 10,
      orderBy: { createdAt: 'desc' },
    });

    const orderedItemIds = new Set<string>();
    const orderedCategoryIds = new Set<string>();
    pastOrders.forEach((o) => {
      o.items.forEach((item) => {
        if (item.menuItem) {
          orderedItemIds.add(item.menuItem.id);
          orderedCategoryIds.add(item.menuItem.categoryId);
        }
      });
    });

    // 2. Fetch collaborative popularity statistics (most ordered items globally)
    const popularityStats = await this.prisma.orderItem.groupBy({
      by: ['menuItemId'],
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
      take: 5,
    });
    const popularItemIds = new Set(popularityStats.map((p) => p.menuItemId));

    // 3. Fetch active restaurants and menus
    const restaurants = await this.prisma.restaurant.findMany({
      where: { isActive: true },
      include: {
        menu: {
          include: {
            categories: {
              include: {
                items: {
                  where: { isAvailable: true },
                },
              },
            },
          },
        },
      },
    });

    // Mock user center coordinates (Indiranagar, Bangalore)
    const userLat = 12.9716;
    const userLng = 77.6412;

    const hour = new Date().getHours();
    const scoredDishes: any[] = [];

    restaurants.forEach((r) => {
      // Calculate Haversine Proximity (km)
      const distance = this.calculateDistance(userLat, userLng, r.latitude, r.longitude);
      const proximityBoost = Math.max(0, 0.5 - distance / 10); // up to +0.5 boost

      if (r.menu) {
        r.menu.categories.forEach((c) => {
          c.items.forEach((item) => {
            let score = 0.5; // base score

            // Proximity weight
            score += proximityBoost;

            // Personal History boost
            if (orderedItemIds.has(item.id)) {
              score += 0.4; // ordered this specific dish before
            }
            if (orderedCategoryIds.has(item.categoryId)) {
              score += 0.2; // ordered from this category before
            }

            // Collaborative popularity boost
            if (popularItemIds.has(item.id)) {
              score += 0.3;
            }

            // Weather classification weights
            const normalizedName = item.name.toLowerCase();
            const normalizedDesc = item.description ? item.description.toLowerCase() : '';

            if (weather === 'RAINY' || weather === 'COLD') {
              // Boost hot items
              if (
                normalizedName.includes('soup') ||
                normalizedName.includes('chai') ||
                normalizedName.includes('tea') ||
                normalizedName.includes('coffee') ||
                normalizedName.includes('biryani') ||
                normalizedDesc.includes('spicy') ||
                normalizedDesc.includes('warm')
              ) {
                score += 0.4;
              }
            } else if (weather === 'SUNNY' || weather === 'HOT') {
              // Boost cold / refreshing items
              if (
                normalizedName.includes('shake') ||
                normalizedName.includes('juice') ||
                normalizedName.includes('cold') ||
                normalizedName.includes('ice cream') ||
                normalizedName.includes('salad') ||
                normalizedDesc.includes('chilled') ||
                normalizedDesc.includes('fresh')
              ) {
                score += 0.4;
              }
            }

            // Time classification slots
            if (hour >= 6 && hour < 11) {
              // Breakfast slots
              if (
                normalizedName.includes('egg') ||
                normalizedName.includes('paratha') ||
                normalizedName.includes('idli') ||
                normalizedName.includes('dosa') ||
                normalizedName.includes('roll') ||
                normalizedName.includes('tea')
              ) {
                score += 0.5;
              }
            } else if (hour >= 11 && hour < 16) {
              // Lunch slots
              if (
                normalizedName.includes('biryani') ||
                normalizedName.includes('meals') ||
                normalizedName.includes('rice') ||
                normalizedName.includes('thali') ||
                normalizedName.includes('burger')
              ) {
                score += 0.5;
              }
            } else if (hour >= 16 && hour < 19) {
              // Snacks slots
              if (
                normalizedName.includes('tea') ||
                normalizedName.includes('coffee') ||
                normalizedName.includes('roll') ||
                normalizedName.includes('sandwich') ||
                normalizedName.includes('snack')
              ) {
                score += 0.5;
              }
            } else if (hour >= 19 && hour <= 24) {
              // Dinner slots
              if (
                normalizedName.includes('biryani') ||
                normalizedName.includes('paneer') ||
                normalizedName.includes('chicken') ||
                normalizedName.includes('mutton') ||
                normalizedName.includes('curry') ||
                normalizedName.includes('naan')
              ) {
                score += 0.5;
              }
            }

            // Pseudo Vector Search semantic emulation (matches item characteristics)
            if (normalizedDesc.includes('healthy') || normalizedDesc.includes('organic')) {
              score += 0.15;
            }

            scoredDishes.push({
              id: item.id,
              name: item.name,
              price: item.price,
              description: item.description,
              isVeg: item.isVeg,
              calories: item.calories,
              restaurantId: r.id,
              restaurantName: r.name,
              score: parseFloat(score.toFixed(2)),
              distanceKm: parseFloat(distance.toFixed(1)),
            });
          });
        });
      }
    });

    // Sort by final combined score descending
    scoredDishes.sort((a, b) => b.score - a.score);

    // Return top 8 recommended items
    return scoredDishes.slice(0, 8);
  }

  async getPromoRecommendations(
    userId: string,
    demand: 'LOW' | 'MEDIUM' | 'HIGH' = 'MEDIUM',
    weather: 'SUNNY' | 'RAINY' | 'COLD' | 'HOT' | 'WINDY' = 'SUNNY',
    traffic: 'LOW' | 'MEDIUM' | 'HEAVY' = 'LOW',
    festival: 'NONE' | 'DIWALI' | 'HOLI' | 'CHRISTMAS' | 'EID' | 'NEW_YEAR' = 'NONE',
    distanceKm: number = 2.5,
  ) {
    const recommendedPromos: any[] = [];

    // 1. Demand Rules
    if (demand === 'LOW') {
      recommendedPromos.push({
        id: 'promo-demand-low',
        code: 'DEMANDBOOST',
        title: 'Demand Dip Special',
        description: 'Get Flat ₹80 off on order values above ₹200 to beat the slow hours!',
        discountType: 'FLAT',
        discountValue: 80,
        minOrderValue: 200,
        badge: 'Demand Booster',
        factors: ['Demand'],
        impact: 'Triggered by Low platform demand (helps outlets increase order volume).',
      });
    } else if (demand === 'HIGH') {
      recommendedPromos.push({
        id: 'promo-demand-high',
        code: 'RUSHHOUR',
        title: 'Peak Rush Special',
        description: 'Get Flat ₹50 off on orders above ₹400 (Celebrate dining in style during rush hour!).',
        discountType: 'FLAT',
        discountValue: 50,
        minOrderValue: 400,
        badge: 'Rush Reward',
        factors: ['Demand'],
        impact: 'Triggered by High platform demand (optimizes rider efficiency for premium orders).',
      });
    }

    // 2. Weather Rules
    if (weather === 'RAINY') {
      recommendedPromos.push({
        id: 'promo-weather-rainy',
        code: 'RAINY40',
        title: 'Rainy Day Comforts',
        description: 'Get Flat ₹60 discount on hot soups, spicy dishes & chai (Stay warm inside!).',
        discountType: 'FLAT',
        discountValue: 60,
        minOrderValue: 150,
        badge: 'Rainy Special',
        factors: ['Weather'],
        impact: 'Triggered by Rainy weather conditions.',
      });
    } else if (weather === 'COLD' || weather === 'WINDY') {
      recommendedPromos.push({
        id: 'promo-weather-cold',
        code: 'WARMUP',
        title: 'Winter Warm Up',
        description: '15% off up to ₹60 on all piping hot beverages and starters!',
        discountType: 'PERCENTAGE',
        discountValue: 15,
        maxDiscount: 60,
        minOrderValue: 120,
        badge: 'Warm Up Deal',
        factors: ['Weather'],
        impact: 'Triggered by Cold or Windy weather.',
      });
    } else if (weather === 'HOT' || weather === 'SUNNY') {
      recommendedPromos.push({
        id: 'promo-weather-hot',
        code: 'COOLBEATS',
        title: 'Beat the Heat',
        description: 'Flat ₹50 off on refreshing cold beverages, ice creams & juices.',
        discountType: 'FLAT',
        discountValue: 50,
        minOrderValue: 180,
        badge: 'Beat the Heat',
        factors: ['Weather'],
        impact: 'Triggered by Hot/Sunny climate.',
      });
    }

    // 3. Traffic Rules
    if (traffic === 'HEAVY') {
      recommendedPromos.push({
        id: 'promo-traffic-pickup',
        code: 'SELFREADY',
        title: 'High Traffic Pickup Saver',
        description: 'Avoid road congestion! Get 20% off up to ₹80 if you choose self-pickup.',
        discountType: 'PERCENTAGE',
        discountValue: 20,
        maxDiscount: 80,
        minOrderValue: 150,
        badge: 'Traffic Bypass',
        factors: ['Traffic'],
        impact: 'Triggered by Heavy traffic conditions (relieves rider strain).',
      });
      recommendedPromos.push({
        id: 'promo-traffic-patience',
        code: 'PATIENCE',
        title: 'Patience Rush Reward',
        description: 'Riders are delayed by traffic. Get Flat ₹30 off as a reward for your patience.',
        discountType: 'FLAT',
        discountValue: 30,
        minOrderValue: 200,
        badge: 'Traffic Rush Relief',
        factors: ['Traffic'],
        impact: 'Triggered by Heavy traffic conditions.',
      });
    }

    // 4. Distance Rules
    if (distanceKm <= 2.0) {
      recommendedPromos.push({
        id: 'promo-distance-near',
        code: 'NEIGHBOR',
        title: 'Local Neighborhood Deal',
        description: 'Flat ₹40 off (Covers delivery fee!) for ordering from local joints within 2km.',
        discountType: 'FLAT',
        discountValue: 40,
        minOrderValue: 150,
        badge: 'Local Free Delivery',
        factors: ['Distance'],
        impact: 'Triggered by Proximity (restaurant is within 2 km).',
      });
    } else if (distanceKm > 5.0) {
      recommendedPromos.push({
        id: 'promo-distance-far',
        code: 'LONGROUTE',
        title: 'Long Distance Relief',
        description: 'Flat ₹80 off on delivery and service fee for long distance orders (>5km).',
        discountType: 'FLAT',
        discountValue: 80,
        minOrderValue: 300,
        badge: 'Long Distance Saver',
        factors: ['Distance'],
        impact: 'Triggered by Distance (restaurant is over 5 km away).',
      });
    }

    // 5. Festival Rules
    if (festival !== 'NONE') {
      if (festival === 'DIWALI') {
        recommendedPromos.push({
          id: 'promo-festival-diwali',
          code: 'DIWALIFEAST',
          title: 'Diwali Festive Feast',
          description: 'Share the joy! Flat 25% off up to ₹150 on family size combos.',
          discountType: 'PERCENTAGE',
          discountValue: 25,
          maxDiscount: 150,
          minOrderValue: 400,
          badge: 'Festive Delight',
          factors: ['Festival'],
          impact: 'Triggered by Diwali festival season.',
        });
      } else if (festival === 'HOLI') {
        recommendedPromos.push({
          id: 'promo-festival-holi',
          code: 'HOLIHUES',
          title: 'Holi Colors Carnival',
          description: 'Flat ₹100 off on order values above ₹300 to celebrate with colors.',
          discountType: 'FLAT',
          discountValue: 100,
          minOrderValue: 300,
          badge: 'Festive Delight',
          factors: ['Festival'],
          impact: 'Triggered by Holi festival season.',
        });
      } else if (festival === 'CHRISTMAS') {
        recommendedPromos.push({
          id: 'promo-festival-xmas',
          code: 'XMASJOY',
          title: 'Christmas Cheer Special',
          description: 'Flat 20% off up to ₹100 on desserts and comfort starters.',
          discountType: 'PERCENTAGE',
          discountValue: 20,
          maxDiscount: 100,
          minOrderValue: 200,
          badge: 'Christmas Cheer',
          factors: ['Festival'],
          impact: 'Triggered by Christmas holiday season.',
        });
      } else if (festival === 'EID') {
        recommendedPromos.push({
          id: 'promo-festival-eid',
          code: 'EIDMUBARAK',
          title: 'Eid Mubarak Feast',
          description: 'Celebrate with Biryani! Flat 20% off up to ₹120 on all main courses.',
          discountType: 'PERCENTAGE',
          discountValue: 20,
          maxDiscount: 120,
          minOrderValue: 250,
          badge: 'Festive Delight',
          factors: ['Festival'],
          impact: 'Triggered by Eid celebration.',
        });
      } else if (festival === 'NEW_YEAR') {
        recommendedPromos.push({
          id: 'promo-festival-newyear',
          code: 'NEWYEAR20',
          title: 'New Year Resolve Deal',
          description: 'Happy New Year! Flat 20% off up to ₹150 on your favorite meals.',
          discountType: 'PERCENTAGE',
          discountValue: 20,
          maxDiscount: 150,
          minOrderValue: 250,
          badge: 'New Year Special',
          factors: ['Festival'],
          impact: 'Triggered by New Year season.',
        });
      }
    }

    // 6. Inventory Rules (Dynamic Database Stock Query)
    // Find active menu items that have surplus stock (quantity > 20)
    const surplusItems = await this.prisma.inventory.findMany({
      where: {
        quantity: {
          gt: 20,
        },
      },
      include: {
        menuItem: {
          include: {
            category: {
              include: {
                menu: {
                  include: {
                    restaurant: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    surplusItems.forEach((surplus) => {
      const item = surplus.menuItem;
      const rest = item.category.menu.restaurant;
      const code = `${item.name.replace(/[^a-zA-Z]/g, '').slice(0, 7).toUpperCase()}${surplus.quantity}`;

      recommendedPromos.push({
        id: `promo-inventory-${item.id}`,
        code,
        title: `Surplus Clearance: ${item.name}`,
        description: `Save 30% on ${item.name} at ${rest.name}! Enjoy fresh food and clear surplus stock.`,
        discountType: 'PERCENTAGE',
        discountValue: 30,
        maxDiscount: 100,
        minOrderValue: 100,
        badge: 'Surplus Stock Clearance',
        factors: ['Inventory'],
        impact: `Triggered by Surplus Inventory (${surplus.quantity} items left in stock) at ${rest.name}.`,
        discountedItemId: item.id,
        discountedItemName: item.name,
        discountedItemPrice: item.price,
        restaurantId: rest.id,
        restaurantName: rest.name,
      });
    });

    // Make sure all these dynamic coupons are registered in the DB Coupon table so the checkout order creation endpoint can validate them!
    for (const promo of recommendedPromos) {
      await this.prisma.coupon.upsert({
        where: { code: promo.code },
        update: {
          description: promo.description,
          discountType: promo.discountType === 'PERCENTAGE' ? DiscountType.PERCENTAGE : DiscountType.FLAT,
          discountValue: promo.discountValue,
          maxDiscount: promo.maxDiscount || null,
          minOrderValue: promo.minOrderValue,
          isActive: true,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // expires in 24 hours
        },
        create: {
          code: promo.code,
          description: promo.description,
          discountType: promo.discountType === 'PERCENTAGE' ? DiscountType.PERCENTAGE : DiscountType.FLAT,
          discountValue: promo.discountValue,
          maxDiscount: promo.maxDiscount || null,
          minOrderValue: promo.minOrderValue,
          isActive: true,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      });
    }

    const defaultAddress = await this.prisma.address.findFirst({
      where: { userId, isDefault: true },
    });
    const defaultAddressId = defaultAddress ? defaultAddress.id : null;

    return {
      promotions: recommendedPromos,
      defaultAddressId,
    };
  }

  // Haversine distance formula
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth radius in km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }
}
