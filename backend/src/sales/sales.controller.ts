import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { SalesService } from './sales.service';

@Controller('api/sales')
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Post()
  async createSale(@Body() payload: any) {
    return this.salesService.createSale(payload);
  }

  @Get()
  async findAll(@Query('limit') limit?: number) {
    return this.salesService.findAll(limit);
  }
}
