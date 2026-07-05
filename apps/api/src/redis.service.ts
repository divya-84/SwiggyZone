import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client!: Redis;
  private isMock = false;
  private mockStore = new Map<string, { value: string; expires: number | null }>();

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    const host = this.configService.get<string>('REDIS_HOST', 'localhost');
    const port = this.configService.get<number>('REDIS_PORT', 6379);

    try {
      this.client = new Redis({
        host,
        port,
        maxRetriesPerRequest: 1,
        connectTimeout: 1000,
        lazyConnect: true,
      });

      this.client.on('error', (err) => {
        if (!this.isMock) {
          this.isMock = true;
          console.warn(`Redis connection failed (host: ${host}, port: ${port}). Falling back to in-memory cache. Error: ${err.message}`);
        }
      });

      this.client.connect().catch((err) => {
        this.isMock = true;
        console.warn(`Redis connect failed, using in-memory fallback: ${err.message}`);
      });
    } catch (err) {
      this.isMock = true;
      console.warn(`Redis initialization failed, using in-memory fallback: ${err.message}`);
    }
  }

  onModuleDestroy() {
    if (this.client && !this.isMock) {
      try {
        this.client.disconnect();
      } catch (err) {}
    }
  }

  async get(key: string): Promise<string | null> {
    if (this.isMock) {
      const item = this.mockStore.get(key);
      if (!item) return null;
      if (item.expires && item.expires < Date.now()) {
        this.mockStore.delete(key);
        return null;
      }
      return item.value;
    }
    try {
      return await this.client.get(key);
    } catch (err) {
      this.isMock = true;
      console.warn(`Redis get failed, falling back to in-memory cache: ${err.message}`);
      return this.get(key);
    }
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (this.isMock) {
      const expires = ttlSeconds ? Date.now() + ttlSeconds * 1000 : null;
      this.mockStore.set(key, { value, expires });
      return;
    }
    try {
      if (ttlSeconds) {
        await this.client.set(key, value, 'EX', ttlSeconds);
      } else {
        await this.client.set(key, value);
      }
    } catch (err) {
      this.isMock = true;
      console.warn(`Redis set failed, falling back to in-memory cache: ${err.message}`);
      await this.set(key, value, ttlSeconds);
    }
  }

  async del(key: string): Promise<void> {
    if (this.isMock) {
      this.mockStore.delete(key);
      return;
    }
    try {
      await this.client.del(key);
    } catch (err) {
      this.isMock = true;
      console.warn(`Redis del failed, falling back to in-memory cache: ${err.message}`);
      await this.del(key);
    }
  }
}
