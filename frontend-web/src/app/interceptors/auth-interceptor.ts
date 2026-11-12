import { inject } from '@angular/core';
import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from '../services/auth';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const api = new URL(environment.apiUrl, window.location.origin);
  const target = new URL(request.url, window.location.origin);
  const basePath = api.pathname.replace(/\/$/, '');
  if (target.origin !== api.origin || (target.pathname !== basePath && !target.pathname.startsWith(`${basePath}/`))) {
    return next(request);
  }

  const auth = inject(AuthService);
  const router = inject(Router);
  const isPublicAuth = /^\/(login|register|verify-otp|resend-otp|forgot-password|reset-password)$/.test(target.pathname.slice(basePath.length));
  const headerToken = request.headers.get('Authorization')?.replace(/^Bearer /, '');
  const token = isPublicAuth ? null : (auth.getToken() || (headerToken && !['null', 'undefined'].includes(headerToken) ? headerToken : null));
  let headers = request.headers.set('Accept', 'application/json').delete('Authorization');
  if (token) headers = headers.set('Authorization', `Bearer ${token}`);

  return next(request.clone({ headers })).pipe(
    catchError((error: HttpErrorResponse) => {
      const sessionInvalid = error.status === 401 || (error.status === 403 && error.error?.code === 'ACCOUNT_SUSPENDED');
      // Une ancienne reponse ne doit pas effacer une nouvelle connexion.
      if (sessionInvalid && token && auth.getToken() === token) {
        auth.clearSession();
        void router.navigate(['/auth']);
      }
      return throwError(() => error);
    })
  );
};
