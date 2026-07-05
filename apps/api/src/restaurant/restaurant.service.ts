import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { InventoryStatus } from '@prisma/client';

@Injectable()
export class RestaurantService {
  constructor(private prisma: PrismaService) {}

  async onboard(ownerId: string, dto: {
    name: string;
    description: string;
    coverImage: string;
    costForTwo: number;
    latitude: number;
    longitude: number;
    openingHour?: string;
    closingHour?: string;
  }) {
    // Onboard restaurant and auto create menu
    const restaurant = await this.prisma.restaurant.create({
      data: {
        ownerId,
        name: dto.name,
        description: dto.description,
        coverImage: dto.coverImage,
        costForTwo: dto.costForTwo,
        latitude: dto.latitude,
        longitude: dto.longitude,
        openingHour: dto.openingHour || '09:00',
        closingHour: dto.closingHour || '22:00',
        isActive: true,
      },
    });

    await this.prisma.menu.create({
      data: {
        restaurantId: restaurant.id,
      },
    });

    return restaurant;
  }

  async getRestaurantByOwner(ownerId: string) {
    const restaurant = await this.prisma.restaurant.findFirst({
      where: { ownerId },
      include: {
        menu: {
          include: {
            categories: {
              include: {
                items: {
                  include: {
                    variants: true,
                    addons: true,
                    inventory: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!restaurant) {
      throw new NotFoundException('Restaurant not onboarded yet');
    }

    return restaurant;
  }

  async updateStatus(restaurantId: string, ownerId: string, isActive: boolean) {
    await this.verifyOwnership(restaurantId, ownerId);
    return this.prisma.restaurant.update({
      where: { id: restaurantId },
      data: { isActive },
    });
  }

  async createCategory(restaurantId: string, ownerId: string, name: string) {
    const restaurant = await this.verifyOwnership(restaurantId, ownerId);
    
    let menu = await this.prisma.menu.findUnique({
      where: { restaurantId },
    });

    if (!menu) {
      menu = await this.prisma.menu.create({
        data: { restaurantId },
      });
    }

    return this.prisma.category.create({
      data: {
        menuId: menu.id,
        name,
        sortOrder: 0,
      },
    });
  }

  async createMenuItem(categoryId: string, ownerId: string, dto: {
    name: string;
    description: string;
    price: number;
    image?: string;
    isVeg: boolean;
    calories: number;
    protein?: number;
    carbohydrates?: number;
    fats?: number;
    initialStock?: number;
  }) {
    const category = await this.prisma.category.findUnique({
      where: { id: categoryId },
      include: { menu: true },
    });
    if (!category) throw new NotFoundException('Category not found');
    await this.verifyOwnership(category.menu.restaurantId, ownerId);

    const item = await this.prisma.menuItem.create({
      data: {
        categoryId,
        name: dto.name,
        description: dto.description,
        price: dto.price,
        image: dto.image,
        isVeg: dto.isVeg,
        calories: dto.calories,
        protein: dto.protein || 0,
        carbohydrates: dto.carbohydrates || 0,
        fats: dto.fats || 0,
      },
    });

    // Create inventory record
    await this.prisma.inventory.create({
      data: {
        menuItemId: item.id,
        quantity: dto.initialStock || 50,
        status: (dto.initialStock || 50) > 0 ? InventoryStatus.IN_STOCK : InventoryStatus.OUT_OF_STOCK,
      },
    });

    return item;
  }

  async updateMenuItem(itemId: string, ownerId: string, dto: {
    name?: string;
    description?: string;
    price?: number;
    isAvailable?: boolean;
    isVeg?: boolean;
  }) {
    const item = await this.prisma.menuItem.findUnique({
      where: { id: itemId },
      include: { category: { include: { menu: true } } },
    });
    if (!item) throw new NotFoundException('Menu item not found');
    await this.verifyOwnership(item.category.menu.restaurantId, ownerId);

    return this.prisma.menuItem.update({
      where: { id: itemId },
      data: dto,
    });
  }

  async deleteMenuItem(itemId: string, ownerId: string) {
    const item = await this.prisma.menuItem.findUnique({
      where: { id: itemId },
      include: { category: { include: { menu: true } } },
    });
    if (!item) throw new NotFoundException('Menu item not found');
    await this.verifyOwnership(item.category.menu.restaurantId, ownerId);

    await this.prisma.menuItem.delete({
      where: { id: itemId },
    });

    return { message: 'Menu item deleted successfully' };
  }

  async updateInventory(itemId: string, ownerId: string, quantity: number) {
    const item = await this.prisma.menuItem.findUnique({
      where: { id: itemId },
      include: { category: { include: { menu: true } } },
    });
    if (!item) throw new NotFoundException('Menu item not found');
    await this.verifyOwnership(item.category.menu.restaurantId, ownerId);

    let status: InventoryStatus = InventoryStatus.IN_STOCK;
    if (quantity === 0) status = InventoryStatus.OUT_OF_STOCK;
    else if (quantity <= 5) status = InventoryStatus.LOW_STOCK;

    return this.prisma.inventory.update({
      where: { menuItemId: itemId },
      data: {
        quantity,
        status,
      },
    });
  }

  async getAnalytics(restaurantId: string, ownerId: string) {
    await this.verifyOwnership(restaurantId, ownerId);

    const orders = await this.prisma.order.findMany({
      where: { restaurantId, status: 'DELIVERED' },
    });

    const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
    const orderCount = orders.length;

    // Mock analytics charts data
    return {
      totalRevenue,
      orderCount,
      revenueHistory: [
        { name: 'Mon', value: totalRevenue * 0.1 },
        { name: 'Tue', value: totalRevenue * 0.15 },
        { name: 'Wed', value: totalRevenue * 0.12 },
        { name: 'Thu', value: totalRevenue * 0.2 },
        { name: 'Fri', value: totalRevenue * 0.25 },
        { name: 'Sat', value: totalRevenue * 0.3 },
        { name: 'Sun', value: totalRevenue * 0.28 },
      ],
      popularItems: [
        { name: 'Special Saffron Biryani', count: 48 },
        { name: 'Paneer Tikka Roll', count: 32 },
        { name: 'Lava Cake', count: 24 },
      ],
    };
  }

  async getReviewsSummary(restaurantId: string) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
    });
    if (!restaurant) throw new NotFoundException('Restaurant not found');

    let reviews = await this.prisma.review.findMany({
      where: { restaurantId },
    });

    // If no database reviews are present, use mock reviews based on restaurant rating to prevent empty states
    if (reviews.length === 0) {
      reviews = [
        {
          id: 'mock-1',
          userId: 'mock-user-1',
          restaurantId,
          menuItemId: null,
          orderId: 'mock-order-1',
          rating: 5,
          comment: 'The packaging was super clean and leakage-proof. Taste was excellent, but delivery took 40 minutes.',
          createdAt: new Date(),
          updatedAt: new Date(),
          deliveryPartnerId: null,
        },
        {
          id: 'mock-2',
          userId: 'mock-user-2',
          restaurantId,
          menuItemId: null,
          orderId: 'mock-order-2',
          rating: 5,
          comment: 'Really good food, highly recommended. Taste is authentic and fresh.',
          createdAt: new Date(),
          updatedAt: new Date(),
          deliveryPartnerId: null,
        },
        {
          id: 'mock-3',
          userId: 'mock-user-3',
          restaurantId,
          menuItemId: null,
          orderId: 'mock-order-3',
          rating: 4,
          comment: 'Spicy chicken biryani was so delicious! Worth the price, but slightly expensive.',
          createdAt: new Date(),
          updatedAt: new Date(),
          deliveryPartnerId: null,
        },
        {
          id: 'mock-4',
          userId: 'mock-user-4',
          restaurantId,
          menuItemId: null,
          orderId: 'mock-order-4',
          rating: 3,
          comment: 'Packaging was slightly leaked, but taste compensated. Delivery speed was decent.',
          createdAt: new Date(),
          updatedAt: new Date(),
          deliveryPartnerId: null,
        },
        {
          id: 'mock-5',
          userId: 'mock-user-5',
          restaurantId,
          menuItemId: null,
          orderId: 'mock-order-5',
          rating: 2,
          comment: 'Poor delivery service, order arrived late and cold. Flavor was okay but overpriced.',
          createdAt: new Date(),
          updatedAt: new Date(),
          deliveryPartnerId: null,
        },
      ];
    }

    const total = reviews.length;
    const positiveCount = reviews.filter((r) => r.rating >= 4).length;
    const neutralCount = reviews.filter((r) => r.rating === 3).length;
    const negativeCount = reviews.filter((r) => r.rating <= 2).length;

    const positivePercent = Math.round((positiveCount / total) * 100);
    const neutralPercent = Math.round((neutralCount / total) * 100);
    const negativePercent = Math.round((negativeCount / total) * 100);

    // Topic keyword mapping helper
    const getTopicAverage = (keywords: string[], defaultScore: number) => {
      const matched = reviews.filter((r) =>
        keywords.some((kw) => r.comment?.toLowerCase().includes(kw))
      );
      if (matched.length === 0) return defaultScore;
      const sum = matched.reduce((acc, curr) => acc + curr.rating, 0);
      return Math.round((sum / matched.length) * 2 * 10) / 10; // score out of 10
    };

    const tasteScore = getTopicAverage(['taste', 'delicious', 'flavor', 'authentic', 'yummy', 'spicy', 'salt'], 9.0);
    const packagingScore = getTopicAverage(['package', 'packaging', 'box', 'leak', 'leaked', 'spill', 'container', 'clean'], 8.2);
    const deliveryScore = getTopicAverage(['delivery', 'rider', 'delay', 'time', 'late', 'fast', 'speed', 'minutes'], 7.5);
    const priceScore = getTopicAverage(['price', 'expensive', 'cheap', 'cost', 'value', 'pocket', 'money', 'affordable'], 8.0);

    const insights = [
      `Taste: Rated ${tasteScore}/10. Customers highly praise the authentic flavors and preparation quality.`,
      `Packaging: Rated ${packagingScore}/10. Food containers are generally secure, with minor notes on spills.`,
      `Delivery: Rated ${deliveryScore}/10. Standard delivery speed is good, but peak hours show occasional delays.`,
      `Price: Rated ${priceScore}/10. High value perception for combo portions despite premium pricing tiers.`,
    ];

    return {
      restaurantId,
      restaurantName: restaurant.name,
      totalReviews: total,
      sentiments: {
        positive: positivePercent,
        neutral: neutralPercent,
        negative: negativePercent,
      },
      topics: {
        taste: tasteScore,
        packaging: packagingScore,
        delivery: deliveryScore,
        price: priceScore,
      },
      insights,
    };
  }

  private async verifyOwnership(restaurantId: string, ownerId: string) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
    });

    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }

    if (restaurant.ownerId !== ownerId) {
      throw new ForbiddenException('Not authorized for this restaurant');
    }

    return restaurant;
  }
}
