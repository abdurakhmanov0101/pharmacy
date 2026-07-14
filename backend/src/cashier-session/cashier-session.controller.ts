import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { CashierSessionService } from './cashier-session.service';

@Controller('api/sessions')
export class CashierSessionController {
  constructor(private readonly sessionService: CashierSessionService) {}

  @Get('current-default')
  getCurrentDefaultSession() {
    return this.sessionService.getCurrentDefaultSession();
  }

  @Post('open-default')
  openDefaultSession(@Body() body: { startingCash: number }) {
    return this.sessionService.openDefaultSession(body.startingCash || 0);
  }

  @Get('current/:userId')
  getCurrentSession(@Param('userId') userId: string) {
    return this.sessionService.getCurrentSession(userId);
  }

  @Post('open')
  openSession(@Body() body: { userId: string; branchId: string; startingCash: number }) {
    return this.sessionService.openSession(body.userId, body.branchId, body.startingCash);
  }

  @Post('close/:id')
  closeSession(
    @Param('id') id: string,
    @Body() body: { closingCash: number; notes?: string },
  ) {
    return this.sessionService.closeSession(id, body.closingCash, body.notes);
  }
}
