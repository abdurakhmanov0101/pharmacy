import { Controller, Get, Post, Delete, Param, Body } from '@nestjs/common';
import { ExpensesService } from './expenses.service';

@Controller('api/expenses')
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Get()
  findAll() {
    return this.expensesService.findAll();
  }

  @Get('summary')
  getSummary() {
    return this.expensesService.getFinancialSummary();
  }

  @Post()
  create(@Body() body: {
    title: string;
    category: string;
    amount: number;
    employeeId?: string;
    branchId?: string;
    notes?: string;
  }) {
    return this.expensesService.create(body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.expensesService.remove(id);
  }
}
