import { Body, Controller, Post, HttpCode, HttpStatus, Request, UseGuards, Put } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from './auth.guard'; // We will create this

@Controller('api/auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @HttpCode(HttpStatus.OK)
  @Post('login')
  signIn(@Body() signInDto: Record<string, any>) {
    return this.authService.login(signInDto.email, signInDto.password);
  }

  @UseGuards(AuthGuard)
  @Put('change-password')
  changePassword(@Request() req: any, @Body() body: Record<string, any>) {
    return this.authService.changePassword(req.user.sub, body.newPassword);
  }
}
