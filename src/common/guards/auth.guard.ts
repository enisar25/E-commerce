import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '../utils/security/token';
import { UserRepo } from 'src/user/user.repo';
import { HUser } from 'src/user/user.model';
import { Request } from 'express';
import { JwtPayload } from '../utils/security/token';

export interface AuthRequest extends Request {
  user: HUser;
}

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly logger = new Logger(AuthGuard.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly userRepo: UserRepo,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req: AuthRequest = context.switchToHttp().getRequest();

    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing access token');
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      throw new UnauthorizedException('Invalid token format');
    }

    // Verify token
    let decoded: JwtPayload;
    try {
      decoded = await this.jwtService.verifyToken(token);
    } catch (error) {
      this.logger.warn(`Token verification failed: ${error.message}`);
      throw new UnauthorizedException('Invalid or expired token');
    }

    // Fetch user from database
    const user = await this.userRepo.findById({ id: decoded.id });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Verify email is confirmed
    if (!user.isVerified) {
      throw new ForbiddenException('Email not verified');
    }

    // Optional: Verify role hasn't changed (if role was in token)
    if (decoded.role && decoded.role !== (user.role as string)) {
      this.logger.warn(
        `User ${decoded.id} role changed from ${decoded.role} to ${user.role}`,
      );
      // Token is still valid, but role changed - user needs to re-login
      // For now, we'll allow it but log the change
    }

    // Attach user to request
    req.user = user;
    return true;
  }
}
