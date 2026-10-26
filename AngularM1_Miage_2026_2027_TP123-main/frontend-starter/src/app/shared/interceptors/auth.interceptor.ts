import { inject } from '@angular/core';
import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

/** Adds the bearer token to protected API requests and ends expired sessions. */
export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const token = auth.token();
  const pathname = request.url.split('?')[0];
  const isPublicEndpoint = [
    '/api/health',
    '/api/auth/login',
    '/api/auth/register',
  ].some((endpoint) => pathname.endsWith(endpoint));
  const isProtectedApiRequest = pathname.startsWith('/api/') && !isPublicEndpoint;
  const sendsSessionToken = isProtectedApiRequest && Boolean(token);
  const authenticatedRequest =
    sendsSessionToken && token
      ? request.clone({
          setHeaders: { Authorization: `Bearer ${token}` },
        })
      : request;

  return next(authenticatedRequest).pipe(
    catchError((error: unknown) => {
      // A 401 is a session-expiry signal only when this request carried a JWT.
      // Public login failures therefore stay on the login page.
      if (
        error instanceof HttpErrorResponse &&
        error.status === 401 &&
        sendsSessionToken
      ) {
        auth.logout();
        void router.navigateByUrl('/login');
      }

      return throwError(() => error);
    }),
  );
};
