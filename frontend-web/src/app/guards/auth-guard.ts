import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth';
import { catchError, map, of } from 'rxjs';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedIn()) {
    return authService.getUser().pipe(
      map(() => true),
      catchError(() => of(router.createUrlTree(['/auth'])))
    );
  }

  // S'il n'est pas connect�, on le redirige vers la page de login
  return router.createUrlTree(['/auth']);
};
