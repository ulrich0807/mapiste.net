import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { AuthService } from '../services/auth';

export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const token = auth.getToken();

  if (!token) return router.createUrlTree(['/auth']);

  return auth.getUser().pipe(
    map(user => user.is_admin ? true : router.createUrlTree(['/'])),
    catchError(() => of(router.createUrlTree(['/auth'])))
  );
};
