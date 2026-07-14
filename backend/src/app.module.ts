import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RolesGuard } from './common/guards/roles.guard';
import { PrismaService } from './prisma.service';
import { MedicinesModule } from './medicines/medicines.module';
import { SalesModule } from './sales/sales.module';
import { InventoryModule } from './inventory/inventory.module';
import { ReportsModule } from './reports/reports.module';
import { TelegramModule } from './telegram/telegram.module';
import { EmployeesModule } from './employees/employees.module';
import { AttendanceModule } from './attendance/attendance.module';
import { SecurityModule } from './security/security.module';
import { BranchesModule } from './branches/branches.module';
import { LeaveModule } from './leave/leave.module';
import { PayrollModule } from './payroll/payroll.module';
import { ShiftModule } from './shift/shift.module';
import { ExpensesModule } from './expenses/expenses.module';
import { CustomersModule } from './customers/customers.module';
import { CashierSessionModule } from './cashier-session/cashier-session.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    AuthModule,
    MedicinesModule,
    SalesModule,
    InventoryModule,
    ReportsModule,
    TelegramModule,
    EmployeesModule,
    AttendanceModule,
    SecurityModule,
    BranchesModule,
    LeaveModule,
    PayrollModule,
    ShiftModule,
    ExpensesModule,
    CustomersModule,
    CashierSessionModule,
  ],
  controllers: [AppController],
  providers: [
    AppService, 
    PrismaService,
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    }
  ],
})
export class AppModule {}
