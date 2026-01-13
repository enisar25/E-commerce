import { Injectable } from '@nestjs/common';
import { JwtService as JWT, JwtSignOptions, JwtVerifyOptions } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

export interface JwtPayload {
  id: string;
  email?: string;
  role?: string;
}

@Injectable()
export class JwtService {
  constructor(
    private readonly jwtService: JWT,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Generate a JWT token with default configuration
   * @param payload - Token payload
   * @param options - Optional JWT sign options (will merge with defaults)
   * @returns JWT token string
   */
  async generateToken<T extends object = JwtPayload>(
    payload: T,
    options?: Partial<JwtSignOptions>,
  ): Promise<string> {
    const secret = this.configService.get<string>('jwt.secret');
    const expiresIn = this.configService.get<string>('jwt.expiresIn') || '7d';

    if (!secret) {
      throw new Error('JWT_SECRET is not configured');
    }

    const defaultOptions: JwtSignOptions = {
      secret,
      expiresIn: expiresIn as any,
    };

    const signOptions: JwtSignOptions = {
      ...defaultOptions,
      ...options,
    };

    return this.jwtService.sign(payload, signOptions);
  }

  /**
   * Verify a JWT token
   * @param token - JWT token string
   * @param options - Optional JWT verify options
   * @returns Decoded token payload
   * @throws Error if token is invalid or expired
   */
  async verifyToken<T extends object = JwtPayload>(
    token: string,
    options?: Partial<JwtVerifyOptions>,
  ): Promise<T> {
    const secret = this.configService.get<string>('jwt.secret');

    if (!secret) {
      throw new Error('JWT_SECRET is not configured');
    }

    const defaultOptions: JwtVerifyOptions = {
      secret,
    };

    const verifyOptions: JwtVerifyOptions = {
      ...defaultOptions,
      ...options,
    };

    return this.jwtService.verify(token, verifyOptions) as T;
  }

}
