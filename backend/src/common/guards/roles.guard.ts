import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles) {
      return true; // No roles required
    }
    
    const request = context.switchToHttp().getRequest();
    const user = request.user; // This will be populated by AuthGuard

    if (!user || !user.role) {
      throw new ForbiddenException('API ga kirish uchun ruxsat etilmagan. Avtorizatsiya qilinmagan.');
    }

    const hasRole = requiredRoles.includes(user.role);
    if (!hasRole) {
      throw new ForbiddenException(`Ushbu amalni bajarish uchun ${requiredRoles.join(' yoki ')} huquqi kerak.`);
    }

    return true;
  }
}
