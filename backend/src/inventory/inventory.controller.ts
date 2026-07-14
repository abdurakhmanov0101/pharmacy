import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { InventoryService } from './inventory.service';

@Controller('api/inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get()
  findAll(@Query('branchId') branchId?: string, @Query('limit') limit?: number, @Query('search') search?: string) {
    return this.inventoryService.findAll(branchId, limit, search);
  }

  @Get('low-stock')
  getLowStock(@Query('threshold') threshold?: string, @Query('branchId') branchId?: string) {
    return this.inventoryService.getLowStock(threshold ? parseInt(threshold) : 20, branchId);
  }

  @Get('expiring')
  getExpiring(@Query('days') days?: string, @Query('branchId') branchId?: string) {
    return this.inventoryService.getExpiring(days ? parseInt(days) : 30, branchId);
  }

  @Get('expired')
  getExpired(@Query('branchId') branchId?: string) {
    return this.inventoryService.getExpired(branchId);
  }

  @Get('total-value')
  getTotalValue(@Query('branchId') branchId?: string) {
    return this.inventoryService.getTotalValue(branchId);
  }

  @Post('adjust')
  adjust(@Body() body: { medicineId: string; quantity: number; notes?: string; branchId: string }) {
    return this.inventoryService.adjust(body.medicineId, body.quantity, body.notes || '', body.branchId);
  }

  @Post('write-off')
  writeOff(@Body() body: { medicineId: string; quantity: number; reason: string; branchId: string }) {
    return this.inventoryService.writeOff(body.medicineId, body.quantity, body.reason, body.branchId);
  }

  @Post('receive')
  receive(@Body() body: {
    medicineId?: string;
    name?: string;
    genericName?: string;
    price: number;
    purchasePrice: number;
    branchId: string;
    quantity: number;
    expiryDate?: string;
    batchNumber?: string;
  }) {
    return this.inventoryService.receiveStock(body);
  }
}
