import { Controller, Get, Post, Query, HttpCode, HttpStatus, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { SearchService } from './search.service';

@ApiTags('Search & Discovery')
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  @ApiOperation({ summary: 'Search restaurants and food items with filters' })
  @ApiQuery({ name: 'q', required: false })
  @ApiQuery({ name: 'lat', required: false, type: Number })
  @ApiQuery({ name: 'lng', required: false, type: Number })
  @ApiQuery({ name: 'minPrice', required: false, type: Number })
  @ApiQuery({ name: 'maxPrice', required: false, type: Number })
  @ApiQuery({ name: 'rating', required: false, type: Number })
  async search(
    @Query('q') q?: string,
    @Query('lat') lat?: string,
    @Query('lng') lng?: string,
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
    @Query('rating') rating?: string,
  ) {
    return this.searchService.search({
      q,
      lat: lat ? parseFloat(lat) : undefined,
      lng: lng ? parseFloat(lng) : undefined,
      minPrice: minPrice ? parseFloat(minPrice) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
      rating: rating ? parseFloat(rating) : undefined,
    });
  }

  @Get('autocomplete')
  @ApiOperation({ summary: 'Retrieve autocomplete search suggestions' })
  @ApiQuery({ name: 'q', required: true })
  async autocomplete(@Query('q') q: string) {
    return this.searchService.autocomplete(q);
  }

  @Get('trending')
  @ApiOperation({ summary: 'Retrieve trending search keywords' })
  async getTrending() {
    return this.searchService.getTrendingSearches();
  }

  @Get('restaurants/:id/reviews/summary')
  @ApiOperation({ summary: 'Retrieve sentiment analysis and topic summary of restaurant reviews' })
  async getReviewsSummary(@Param('id') id: string) {
    return this.searchService.getReviewsSummary(id);
  }

  @Post('sync')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sync database records to Elasticsearch indexes (Admin)' })
  async sync() {
    return this.searchService.syncDatabaseToEs();
  }
}
