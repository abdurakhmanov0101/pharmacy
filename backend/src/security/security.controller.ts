import { Controller, Get, Post, Body, Put, Param } from '@nestjs/common';
import { SecurityService } from './security.service';

@Controller('api/security')
export class SecurityController {
  constructor(private readonly securityService: SecurityService) {}

  @Get()
  findAll() {
    return this.securityService.findAll();
  }

  @Put(':id/review')
  markReviewed(@Param('id') id: string) {
    return this.securityService.markAsReviewed(id);
  }

  @Post('event')
  reportEvent(@Body() data: any) {
    return this.securityService.reportSuspiciousEvent(data);
  }
}
