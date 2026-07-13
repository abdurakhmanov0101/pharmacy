import { Controller, Get, Post, Body, Param, Delete, Put } from '@nestjs/common';
import { EmployeesService } from './employees.service';

@Controller('api/employees')
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Get()
  findAll() {
    return this.employeesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.employeesService.findOne(id);
  }

  @Post()
  create(@Body() createEmployeeDto: any) {
    return this.employeesService.create(createEmployeeDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.employeesService.remove(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() data: any) {
    return this.employeesService.update(id, data);
  }
}
