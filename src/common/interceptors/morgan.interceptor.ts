/**
 * Morgan Interceptor
 * Logs HTTP requests with method, URL, status code, and response time
 */
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  Logger,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';

@Injectable()
export class MorganInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const start = Date.now();
    const req = context.switchToHttp().getRequest();
    const { method, originalUrl } = req;

    return next.handle().pipe(
      tap({
        next: () => {
          const res = context.switchToHttp().getResponse();
          const duration = Date.now() - start;
          this.logger.log(
            `${method} ${originalUrl} ${res.statusCode} - ${duration}ms`,
          );
        },
        error: (error) => {
          const duration = Date.now() - start;
          this.logger.error(
            `${method} ${originalUrl} - ${duration}ms - ${error.message}`,
          );
        },
      }),
    );
  }
}
