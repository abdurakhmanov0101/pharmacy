import { Controller, Get, Post, Body } from '@nestjs/common';
import { CustomersService } from './customers.service';

@Controller('api/customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  findAll() {
    return this.customersService.findAll();
  }

  @Post()
  create(@Body() data: { name: string; phone?: string }) {
    return this.customersService.create(data);
  }
}
