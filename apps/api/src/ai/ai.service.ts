import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { RedisService } from '../redis.service';
import OpenAI from 'openai';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private openai: OpenAI | null = null;

  constructor(
    private prisma: PrismaService,
    private redisService: RedisService,
  ) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
      this.logger.log('OpenAI client successfully initialized');
    } else {
      this.logger.warn(
        'OPENAI_API_KEY missing, food assistant running in local RAG engine fallback mode',
      );
    }
  }

  async chat(userId: string, prompt: string) {
    const historyKey = `chat_history:${userId}`;
    const historyStr = (await this.redisService.get(historyKey)) || '[]';
    const history = JSON.parse(historyStr);

    // Fetch active restaurant menu items to feed into RAG context
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

    // Extract all items for RAG parsing
    const allDishes: any[] = [];
    restaurants.forEach((r) => {
      if (r.menu) {
        r.menu.categories.forEach((c) => {
          c.items.forEach((item) => {
            allDishes.push({
              id: item.id,
              name: item.name,
              price: item.price,
              description: item.description,
              isVeg: item.isVeg,
              calories: item.calories,
              restaurantName: r.name,
              restaurantId: r.id,
            });
          });
        });
      }
    });

    // 1. Check allergies in query
    let allergenWarning = '';
    let filteredDishes = [...allDishes];
    const normalizedPrompt = prompt.toLowerCase();

    if (
      normalizedPrompt.includes('peanut') ||
      normalizedPrompt.includes('nut') ||
      normalizedPrompt.includes('allergy')
    ) {
      allergenWarning =
        '⚠️ Note: Allergen filter applied for nuts. Recommending allergen-safe options.';
      filteredDishes = filteredDishes.filter(
        (d) =>
          !d.name.toLowerCase().includes('peanut') &&
          !d.description.toLowerCase().includes('peanut') &&
          !d.name.toLowerCase().includes('cashew') &&
          !d.description.toLowerCase().includes('cashew') &&
          !d.name.toLowerCase().includes('almond'),
      );
    }

    if (
      normalizedPrompt.includes('dairy') ||
      normalizedPrompt.includes('lactose') ||
      normalizedPrompt.includes('milk')
    ) {
      allergenWarning =
        '⚠️ Note: Lactose-free options recommended. Excluding heavy paneer or cream dishes.';
      filteredDishes = filteredDishes.filter(
        (d) =>
          !d.name.toLowerCase().includes('paneer') &&
          !d.description.toLowerCase().includes('paneer') &&
          !d.name.toLowerCase().includes('cheese') &&
          !d.description.toLowerCase().includes('cheese') &&
          !d.description.toLowerCase().includes('cream'),
      );
    }

    // 2. Check budget limits in query
    let budgetLimit: number | null = null;
    const budgetMatch =
      normalizedPrompt.match(/under\s*₹?\s*(\d+)/i) ||
      normalizedPrompt.match(/(\d+)\s*rupees/i) ||
      normalizedPrompt.match(/budget\s*of\s*(\d+)/i);
    if (budgetMatch) {
      budgetLimit = parseInt(budgetMatch[1]);
      filteredDishes = filteredDishes.filter((d) => d.price <= (budgetLimit || 1000));
    }

    // 3. Match specific cuisine keywords
    let matchedDishes = [...filteredDishes];
    if (normalizedPrompt.includes('biryani') || normalizedPrompt.includes('rice')) {
      matchedDishes = filteredDishes.filter(
        (d) => d.name.toLowerCase().includes('biryani') || d.name.toLowerCase().includes('rice'),
      );
    } else if (normalizedPrompt.includes('burger') || normalizedPrompt.includes('sandwich')) {
      matchedDishes = filteredDishes.filter(
        (d) => d.name.toLowerCase().includes('burger') || d.name.toLowerCase().includes('roll'),
      );
    } else if (normalizedPrompt.includes('veg') && !normalizedPrompt.includes('non')) {
      matchedDishes = filteredDishes.filter((d) => d.isVeg);
    }

    // Slice suggestions
    const suggestions = matchedDishes.slice(0, 3);

    // Call OpenAI if client exists
    let responseText = '';
    if (this.openai) {
      try {
        const systemPrompt = `You are SwiggyZone's premium AI food recommender assistant.
Here is the real-time menu database of active restaurants (RAG context):
${JSON.stringify(allDishes.slice(0, 15))}

Rules:
1. Help users with food recommendations, restaurant search, budget matches, and allergy exclusions.
2. If the user mentions any allergy (nuts, dairy, gluten), exclude warning dishes.
3. Suggest actual dishes with exact prices.
4. Keep replies concise and professional. Use markdown formatting.`;

        const messages = [
          { role: 'system', content: systemPrompt },
          ...history.slice(-6),
          { role: 'user', content: prompt },
        ];

        const response = await this.openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: messages as any,
          temperature: 0.7,
        });

        responseText =
          response.choices[0]?.message?.content || 'I could not find matching food items';
      } catch (err) {
        this.logger.error('OpenAI completion failed, using local RAG fallback', err);
        responseText = this.getLocalRagResponse(
          normalizedPrompt,
          suggestions,
          allergenWarning,
          budgetLimit,
        );
      }
    } else {
      responseText = this.getLocalRagResponse(
        normalizedPrompt,
        suggestions,
        allergenWarning,
        budgetLimit,
      );
    }

    // Save turn history
    const updatedHistory = [
      ...history,
      { role: 'user', content: prompt },
      { role: 'assistant', content: responseText },
    ].slice(-10); // Maintain last 10 turns memory

    await this.redisService.set(historyKey, JSON.stringify(updatedHistory), 3600); // 1 hour memory TTL

    return {
      message: responseText,
      recommendations: suggestions,
    };
  }

  private getLocalRagResponse(
    prompt: string,
    suggestions: any[],
    allergenWarning: string,
    budgetLimit: number | null,
  ): string {
    let reply = `Hello! I am your SwiggyZone AI assistant. Here is what I found in our Indiranagar restaurant directory:\n\n`;

    if (allergenWarning) {
      reply += `${allergenWarning}\n\n`;
    }

    if (budgetLimit) {
      reply += `💵 Filtering items priced under **₹${budgetLimit}**.\n\n`;
    }

    if (suggestions.length > 0) {
      reply += `Based on your request, I highly recommend ordering these dishes:\n`;
      suggestions.forEach((d) => {
        const vegLabel = d.isVeg ? '🟢 Veg' : '🔴 Non-Veg';
        reply += `- **${d.name}** at *${d.restaurantName}* (₹${d.price} | ${vegLabel} | ${d.calories} kcal)\n`;
      });
      reply += `\nWould you like me to add any of these Saffron specialties to your cart? Click the recommendation card to add directly!`;
    } else {
      reply += `I couldn't find exact matches matching those constraints in our menu directories. Try searching for "Biryani", "Burger under 400", or "Dairy free rolls".`;
    }

    return reply;
  }

  async clearMemory(userId: string) {
    const historyKey = `chat_history:${userId}`;
    await this.redisService.del(historyKey);
    return { success: true };
  }

  async recognizeFood(fileBuffer: Buffer, fileName: string) {
    let foodName = 'Paneer Tikka Roll';

    if (this.openai) {
      try {
        const base64Image = fileBuffer.toString('base64');
        const response = await this.openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: 'Identify this food dish. Return ONLY the simple food item name, e.g. "Chicken Biryani", "Burger", "Pizza", or "Paneer Tikka Roll". Do not write markdown or sentences.',
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:image/jpeg;base64,${base64Image}`,
                  },
                },
              ],
            },
          ],
          max_tokens: 10,
        });
        foodName = response.choices[0]?.message?.content?.trim() || 'Paneer Tikka Roll';
      } catch (err) {
        this.logger.error('OpenAI Vision API failed, falling back to pattern matching', err);
        foodName = this.localPatternClassifier(fileName);
      }
    } else {
      foodName = this.localPatternClassifier(fileName);
    }

    // Query matching database menu items (RAG)
    const matchingItems = await this.prisma.menuItem.findMany({
      where: {
        name: {
          contains: foodName.split(' ')[0], // search first keyword
        },
      },
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
    });

    const recommendations = matchingItems.map((item) => ({
      id: item.id,
      name: item.name,
      price: item.price,
      description: item.description,
      isVeg: item.isVeg,
      calories: item.calories,
      restaurantId: item.category.menu.restaurant.id,
      restaurantName: item.category.menu.restaurant.name,
    }));

    const avgPrice =
      recommendations.length > 0
        ? recommendations.reduce((sum, r) => sum + r.price, 0) / recommendations.length
        : 250;

    return {
      success: true,
      recognizedFood: foodName,
      confidence: 95,
      estimatedPrice: avgPrice,
      recommendations,
    };
  }

  private localPatternClassifier(fileName: string): string {
    const fn = fileName.toLowerCase();
    if (fn.includes('biryani') || fn.includes('rice')) return 'Chicken Biryani';
    if (fn.includes('burger') || fn.includes('sandwich')) return 'Burger';
    if (fn.includes('pizza') || fn.includes('bread')) return 'Pizza';
    return 'Paneer Tikka Roll';
  }
}
