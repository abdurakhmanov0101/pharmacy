import { Controller, Get, Post, Body } from '@nestjs/common';
import { AttendanceService } from './attendance.service';

@Controller('api/attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Get()
  findAll() {
    return this.attendanceService.findAll();
  }

  @Post('check')
  checkIn(@Body() data: { employeeId: string; cameraId?: string; image?: string }) {
    return this.attendanceService.checkIn(data);
  }
}
