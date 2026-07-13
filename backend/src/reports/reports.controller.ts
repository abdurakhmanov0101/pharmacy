import { Controller, Get, Query } from '@nestjs/common';
import { ReportsService } from './reports.service';

@Controller('api/reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('daily')
  getDaily() {
    return this.reportsService.getSummary('daily');
  }

  @Get('weekly')
  getWeekly() {
    return this.reportsService.getSummary('weekly');
  }

  @Get('monthly')
  getMonthly() {
    return this.reportsService.getSummary('monthly');
  }

  @Get('custom')
  getCustom(@Query('start') start?: string, @Query('end') end?: string) {
    const startDate = start ? new Date(start) : new Date();
    startDate.setHours(0, 0, 0, 0);
    const endDate = end ? new Date(end) : new Date();
    endDate.setHours(23, 59, 59, 999);
    return this.reportsService.getCustomSummary(startDate, endDate);
  }

  @Get('chart')
  getChart() {
    return this.reportsService.getLast7DaysSales();
  }

  @Get('top-medicines')
  getTopMedicines(@Query('limit') limit?: string) {
    return this.reportsService.getTopMedicines(limit ? parseInt(limit) : 10);
  }

  @Get('payment-methods')
  getPaymentMethods(@Query('period') period?: 'daily' | 'weekly' | 'monthly') {
    return this.reportsService.getPaymentMethodStats(period || 'monthly');
  }
}
