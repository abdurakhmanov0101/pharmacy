import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { MedicinesService } from './medicines.service';
import { CreateMedicineDto, UpdateMedicineDto } from './dto/medicine.dto';

@Controller('api/medicines')
export class MedicinesController {
  constructor(private readonly medicinesService: MedicinesService) {}

  @Get()
  findAll(
    @Query('search') search?: string, 
    @Query('page') page?: number,
    @Query('limit') limit?: number
  ) {
    return this.medicinesService.findAll(search, page || 1, limit || 50);
  }

  @Post()
  create(@Body() createMedicineDto: CreateMedicineDto) {
    return this.medicinesService.create(createMedicineDto);
  }

  @Post('bulk')
  createMany(@Body() createMedicineDtos: CreateMedicineDto[]) {
    return this.medicinesService.createMany(createMedicineDtos);
  }

  @Get('barcode/:code')
  findByBarcode(@Param('code') code: string) {
    return this.medicinesService.findByBarcode(code);
  }

  @Post('seed-10k')
  seed10k() {
    return this.medicinesService.seed10k();
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateMedicineDto: UpdateMedicineDto) {
    return this.medicinesService.update(id, updateMedicineDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.medicinesService.remove(id);
  }
}
