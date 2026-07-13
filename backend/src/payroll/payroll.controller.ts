import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { PayrollService } from './payroll.service';
import { CreatePayrollDto } from './dto/create-payroll.dto';
import { UpdatePayrollDto } from './dto/update-payroll.dto';

@Controller('api/payroll')
export class PayrollController {
  constructor(private readonly payrollService: PayrollService) {}

  @Post()
  create(@Body() createPayrollDto: CreatePayrollDto) {
    return this.payrollService.create(createPayrollDto);
  }

  @Post('pay')
  pay(@Body() body: {
    employeeId: string;
    type: 'AVANS' | 'TO_LIQ';
    amount: number;
    month?: string;
    notes?: string;
  }) {
    return this.payrollService.paySalary(body);
  }

  @Get()
  findAll() {
    return this.payrollService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.payrollService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePayrollDto: UpdatePayrollDto) {
    return this.payrollService.update(id, updatePayrollDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.payrollService.remove(id);
  }
}
