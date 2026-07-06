import {
  PrismaClient,
  UserRoleName,
  OrderStatus,
  PaymentStatus,
  PaymentMethod,
  DiscountType,
  InventoryStatus,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database with premium mock restaurants & dishes...');

  // 1. Roles and Permissions
  const permissions = [
    { action: 'create:restaurant', description: 'Can onboard a new restaurant' },
    { action: 'update:restaurant', description: 'Can update restaurant information' },
    { action: 'delete:restaurant', description: 'Can delete a restaurant' },
    { action: 'create:menu', description: 'Can manage categories and menus' },
    { action: 'create:dish', description: 'Can add menu items' },
    { action: 'read:order', description: 'Can view order history' },
    { action: 'update:order', description: 'Can update order delivery status' },
    { action: 'manage:users', description: 'Can manage platform roles' },
  ];

  const dbPermissions = [];
  for (const perm of permissions) {
    const dbPerm = await prisma.permission.upsert({
      where: { action: perm.action },
      update: {},
      create: perm,
    });
    dbPermissions.push(dbPerm);
  }

  const roleDefinitions = [
    { name: UserRoleName.CUSTOMER, description: 'Standard platform customer' },
    { name: UserRoleName.DELIVERY_PARTNER, description: 'Rider making deliveries' },
    { name: UserRoleName.RESTAURANT_OWNER, description: 'Partner restaurant manager' },
    { name: UserRoleName.ADMIN, description: 'Full site administrator' },
  ];

  const roles: Record<UserRoleName, any> = {} as any;
  for (const roleDef of roleDefinitions) {
    const dbRole = await prisma.role.upsert({
      where: { name: roleDef.name },
      update: {},
      create: roleDef,
    });
    roles[roleDef.name] = dbRole;
  }

  // Map Roles to Permissions
  for (const dbPerm of dbPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: roles[UserRoleName.ADMIN].id,
          permissionId: dbPerm.id,
        },
      },
      update: {},
      create: {
        roleId: roles[UserRoleName.ADMIN].id,
        permissionId: dbPerm.id,
      },
    });
  }

  const ownerActions = [
    'create:restaurant',
    'update:restaurant',
    'create:menu',
    'create:dish',
    'read:order',
    'update:order',
  ];
  for (const dbPerm of dbPermissions.filter((p) => ownerActions.includes(p.action))) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: roles[UserRoleName.RESTAURANT_OWNER].id,
          permissionId: dbPerm.id,
        },
      },
      update: {},
      create: {
        roleId: roles[UserRoleName.RESTAURANT_OWNER].id,
        permissionId: dbPerm.id,
      },
    });
  }

  const partnerActions = ['read:order', 'update:order'];
  for (const dbPerm of dbPermissions.filter((p) => partnerActions.includes(p.action))) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: roles[UserRoleName.DELIVERY_PARTNER].id,
          permissionId: dbPerm.id,
        },
      },
      update: {},
      create: {
        roleId: roles[UserRoleName.DELIVERY_PARTNER].id,
        permissionId: dbPerm.id,
      },
    });
  }

  const customerActions = ['read:order'];
  for (const dbPerm of dbPermissions.filter((p) => customerActions.includes(p.action))) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: roles[UserRoleName.CUSTOMER].id,
          permissionId: dbPerm.id,
        },
      },
      update: {},
      create: {
        roleId: roles[UserRoleName.CUSTOMER].id,
        permissionId: dbPerm.id,
      },
    });
  }

  // 2. Users
  const passwordHash = await bcrypt.hash('password123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@swiggyzone.com' },
    update: {},
    create: {
      email: 'admin@swiggyzone.com',
      passwordHash,
      firstName: 'SwiggyZone',
      lastName: 'Admin',
      phoneNumber: '+919999999999',
      isVerified: true,
      roleName: UserRoleName.ADMIN,
    },
  });

  const customer = await prisma.user.upsert({
    where: { email: 'customer@gmail.com' },
    update: {},
    create: {
      email: 'customer@gmail.com',
      passwordHash,
      firstName: 'Rahul',
      lastName: 'Sharma',
      phoneNumber: '+919876543210',
      isVerified: true,
      roleName: UserRoleName.CUSTOMER,
    },
  });

  const owner = await prisma.user.upsert({
    where: { email: 'owner@saffronhub.com' },
    update: {},
    create: {
      email: 'owner@saffronhub.com',
      passwordHash,
      firstName: 'Vikram',
      lastName: 'Mehta',
      phoneNumber: '+919812345678',
      isVerified: true,
      roleName: UserRoleName.RESTAURANT_OWNER,
    },
  });

  const partnerUser = await prisma.user.upsert({
    where: { email: 'partner@delivery.com' },
    update: {},
    create: {
      email: 'partner@delivery.com',
      passwordHash,
      firstName: 'Amit',
      lastName: 'Kumar',
      phoneNumber: '+919800011122',
      isVerified: true,
      roleName: UserRoleName.DELIVERY_PARTNER,
    },
  });

  // 3. Wallets
  await prisma.wallet.upsert({
    where: { userId: customer.id },
    update: {},
    create: {
      userId: customer.id,
      balance: 1500.0,
    },
  });

  await prisma.wallet.upsert({
    where: { userId: owner.id },
    update: {},
    create: {
      userId: owner.id,
      balance: 5000.0,
    },
  });

  // 4. Addresses
  const custAddress = await prisma.address.create({
    data: {
      userId: customer.id,
      label: 'Home',
      street: '12th Main Rd, HAL 2nd Stage, Indiranagar',
      city: 'Bangalore',
      state: 'Karnataka',
      zipCode: '560038',
      latitude: 12.971891,
      longitude: 77.641151,
      isDefault: true,
    },
  });

  // 5. RESTAURANTS DATA
  const restaurantsData = [
    {
      id: 'rest-1',
      name: 'The Saffron Hub',
      description: 'Gourmet North Indian Cuisine & Royal Biryani',
      coverImage: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?q=80&w=800',
      rating: 4.8,
      deliveryTimeMinutes: 25,
      costForTwo: 400,
      isActive: true,
      latitude: 12.9723,
      longitude: 77.6418,
      categories: [
        {
          name: 'Biryanis',
          items: [
            {
              name: 'Special Saffron Chicken Biryani',
              description:
                'Fragrant basmati rice layered with juicy chicken and secret saffron spices.',
              price: 320,
              image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?q=80&w=400',
              isVeg: false,
              calories: 680,
              protein: 32.0,
              carbs: 85.0,
              fats: 22.0,
              variants: [
                { name: 'Half Portion', priceDelta: 0.0 },
                { name: 'Full Portion', priceDelta: 100.0 },
              ],
              addons: [{ name: 'Extra Salan & Raita', price: 20.0, categoryName: 'Sides' }],
            },
          ],
        },
        {
          name: 'Starters',
          items: [
            {
              name: 'Paneer Tikka Roll',
              description: 'Grilled cottage cheese wrapped in a paratha with mint sauce.',
              price: 180,
              image: 'https://images.unsplash.com/photo-1626700051175-6518c4793f4f?q=80&w=400',
              isVeg: true,
              calories: 420,
              protein: 14.5,
              carbs: 48.0,
              fats: 16.0,
              addons: [{ name: 'Extra Cheese Slice', price: 30.0, categoryName: 'Add-ons' }],
            },
          ],
        },
      ],
      reviews: [
        { rating: 5, comment: 'The Saffron Biryani was absolutely royal! Superb packaging.' },
        { rating: 4, comment: 'Very delicious Paneer roll. Fast delivery.' },
      ],
    },
    {
      id: 'rest-2',
      name: 'Burger Craft',
      description: 'Gourmet American Burgers & Crispy Fries',
      coverImage: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=800',
      rating: 4.6,
      deliveryTimeMinutes: 18,
      costForTwo: 300,
      isActive: true,
      latitude: 12.9715,
      longitude: 77.6402,
      categories: [
        {
          name: 'Burgers',
          items: [
            {
              name: 'Craft Smokehouse Beef Burger',
              description:
                'Juicy smashed beef patty, cheddar, smoked bacon, caramelized onion, and barbecue sauce.',
              price: 240,
              image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=400',
              isVeg: false,
              calories: 590,
              protein: 26.0,
              carbs: 40.0,
              fats: 28.0,
              variants: [
                { name: 'Single Patty', priceDelta: 0.0 },
                { name: 'Double Smashed Patty', priceDelta: 80.0 },
              ],
              addons: [
                { name: 'Extra Cheddar Cheese', price: 25.0, categoryName: 'Cheese' },
                { name: 'Crispy Onion Rings', price: 40.0, categoryName: 'Toppings' },
              ],
            },
            {
              name: 'Spicy Paneer Crunch Burger',
              description:
                'Crispy fried cottage cheese patty, spicy chipotle mayo, and fresh lettuce.',
              price: 190,
              image: 'https://images.unsplash.com/photo-1550547660-d9450f859349?q=80&w=400',
              isVeg: true,
              calories: 480,
              protein: 18.0,
              carbs: 42.0,
              fats: 20.0,
            },
          ],
        },
      ],
      reviews: [
        {
          rating: 5,
          comment: 'Best burgers in Indiranagar. The double patty is highly recommended!',
        },
      ],
    },
    {
      id: 'rest-3',
      name: 'Pizzeria Bella',
      description: 'Authentic Wood-fired Italian Pizzas',
      coverImage: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=800',
      rating: 4.7,
      deliveryTimeMinutes: 30,
      costForTwo: 500,
      isActive: true,
      latitude: 12.973,
      longitude: 77.643,
      categories: [
        {
          name: 'Classic Pizzas',
          items: [
            {
              name: 'Margherita Neapoletana',
              description:
                'San Marzano tomatoes, fresh mozzarella, extra virgin olive oil, and sweet basil.',
              price: 290,
              image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?q=80&w=400',
              isVeg: true,
              calories: 620,
              protein: 22.0,
              carbs: 72.0,
              fats: 18.0,
              variants: [
                { name: 'Personal 8"', priceDelta: 0.0 },
                { name: 'Medium 12"', priceDelta: 150.0 },
              ],
              addons: [{ name: 'Extra Mozzarella', price: 50.0, categoryName: 'Cheese' }],
            },
            {
              name: 'Fiery Pepperoni & Mushroom',
              description: 'Spicy Italian pepperoni, sliced mushrooms, chili oil, and oregano.',
              price: 380,
              image: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?q=80&w=400',
              isVeg: false,
              calories: 780,
              protein: 28.0,
              carbs: 74.0,
              fats: 26.0,
            },
          ],
        },
      ],
      reviews: [{ rating: 5, comment: 'Pure Italian taste. Crust is thin, chewy, and perfect.' }],
    },
    {
      id: 'rest-4',
      name: 'Wok Express',
      description: 'Fresh Asian Wok Noodles & Dimsums',
      coverImage: 'https://images.unsplash.com/photo-1525755662778-989d0524087e?q=80&w=800',
      rating: 4.4,
      deliveryTimeMinutes: 20,
      costForTwo: 350,
      isActive: true,
      latitude: 12.9705,
      longitude: 77.6395,
      categories: [
        {
          name: 'Wok Bowls',
          items: [
            {
              name: 'Schezwan Chili Garlic Noodles',
              description:
                'Spicy hand-pulled noodles tossed with bell peppers, garlic, and hot chili paste.',
              price: 180,
              image: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?q=80&w=400',
              isVeg: true,
              calories: 450,
              protein: 8.0,
              carbs: 62.0,
              fats: 10.0,
              variants: [
                { name: 'Regular Veg', priceDelta: 0.0 },
                { name: 'Add Chili Chicken', priceDelta: 60.0 },
              ],
            },
          ],
        },
      ],
      reviews: [{ rating: 4, comment: 'Spicy and super filling. Good quantity.' }],
    },
    {
      id: 'rest-5',
      name: 'Sweet Tooth Desserts',
      description: 'Gourmet Ice Creams, Cakes & Belgian Waffles',
      coverImage: 'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?q=80&w=800',
      rating: 4.9,
      deliveryTimeMinutes: 15,
      costForTwo: 250,
      isActive: true,
      latitude: 12.972,
      longitude: 77.641,
      categories: [
        {
          name: 'Waffles & Cakes',
          items: [
            {
              name: 'Chocolate Lava Cake',
              description: 'Decadent chocolate cake with a warm melting fudge center.',
              price: 140,
              image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?q=80&w=400',
              isVeg: true,
              calories: 350,
              protein: 4.2,
              carbs: 45.0,
              fats: 18.0,
              addons: [{ name: 'Vanilla Ice Cream Scoop', price: 50.0, categoryName: 'Toppings' }],
            },
          ],
        },
      ],
      reviews: [{ rating: 5, comment: 'Best lava cake ever! Tastes incredible when warm.' }],
    },
  ];

  for (const r of restaurantsData) {
    const restaurant = await prisma.restaurant.create({
      data: {
        id: r.id,
        ownerId: owner.id,
        name: r.name,
        description: r.description,
        coverImage: r.coverImage,
        rating: r.rating,
        deliveryTimeMinutes: r.deliveryTimeMinutes,
        costForTwo: r.costForTwo,
        isActive: r.isActive,
        latitude: r.latitude,
        longitude: r.longitude,
        openingHour: '09:00',
        closingHour: '23:00',
      },
    });

    const menu = await prisma.menu.create({
      data: {
        restaurantId: restaurant.id,
      },
    });

    let catSort = 1;
    for (const c of r.categories) {
      const category = await prisma.category.create({
        data: {
          menuId: menu.id,
          name: c.name,
          sortOrder: catSort++,
        },
      });

      for (const itemVal of c.items) {
        const item = itemVal as any;
        const menuItem = await prisma.menuItem.create({
          data: {
            categoryId: category.id,
            name: item.name,
            description: item.description,
            price: item.price,
            image: item.image,
            isAvailable: true,
            isVeg: item.isVeg,
            calories: item.calories,
            protein: item.protein,
            carbohydrates: item.carbs,
            fats: item.fats,
          },
        });

        // Add variants
        if (item.variants) {
          await prisma.menuItemVariant.createMany({
            data: item.variants.map((v) => ({
              menuItemId: menuItem.id,
              name: v.name,
              priceDelta: v.priceDelta,
            })),
          });
        }

        // Add addons
        if (item.addons) {
          await prisma.menuItemAddon.createMany({
            data: item.addons.map((a) => ({
              menuItemId: menuItem.id,
              name: a.name,
              price: a.price,
              categoryName: a.categoryName,
            })),
          });
        }

        // Add Inventory
        await prisma.inventory.create({
          data: {
            menuItemId: menuItem.id,
            quantity: 50,
            lowStockThreshold: 10,
            status: InventoryStatus.IN_STOCK,
          },
        });
      }
    }

    // Add reviews
    for (const rev of r.reviews) {
      // Create a mock order to link review
      const order = await prisma.order.create({
        data: {
          userId: customer.id,
          restaurantId: restaurant.id,
          status: OrderStatus.DELIVERED,
          subtotal: r.costForTwo,
          deliveryFee: 40,
          tax: 15,
          total: r.costForTwo + 55,
          addressId: custAddress.id,
        },
      });

      await prisma.review.create({
        data: {
          userId: customer.id,
          restaurantId: restaurant.id,
          orderId: order.id,
          rating: rev.rating,
          comment: rev.comment,
        },
      });
    }
  }

  // 6. Delivery Partner
  const deliveryPartner = await prisma.deliveryPartner.create({
    data: {
      userId: partnerUser.id,
      vehicleType: 'BIKE',
      licensePlate: 'KA-03-HA-1234',
      isActive: true,
      latitude: 12.9715,
      longitude: 77.6405,
    },
  });

  // 7. Coupons
  await prisma.coupon.createMany({
    data: [
      {
        code: 'SWIGGY50',
        description: '50% off on your first order up to ₹100',
        discountType: DiscountType.PERCENTAGE,
        discountValue: 50.0,
        maxDiscount: 100.0,
        minOrderValue: 150.0,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        isActive: true,
      },
      {
        code: 'FREEDEL',
        description: 'Flat ₹40 discount (Covers Delivery Fee)',
        discountType: DiscountType.FLAT,
        discountValue: 40.0,
        minOrderValue: 200.0,
        expiresAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        isActive: true,
      },
    ],
  });

  console.log('Database seeded successfully with premium restaurants!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
