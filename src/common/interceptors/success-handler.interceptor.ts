/**
 * Success Handler Interceptor
 * Standardizes successful API responses
 */
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { MESSAGES } from '../constants';

@Injectable()
export class SuccessHandlerInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((res) => {
        // If response already has the correct format, return as is
        if (res && typeof res === 'object' && 'statusCode' in res) {
          return res;
        }

        // Otherwise, wrap in standard format
        const {
          data = res,
          message = MESSAGES.SUCCESS,
          statusCode = 200,
        } = res || {};
        return {
          statusCode,
          message,
          data,
        };
      }),
    );
  }
}
