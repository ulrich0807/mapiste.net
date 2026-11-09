import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedIn()) {
    return true; // L'utilisateur passe
  }

  // S'il n'est pas connecté, on le redirige vers la page de login
  router.navigate(['/auth']);
  return false; 
};