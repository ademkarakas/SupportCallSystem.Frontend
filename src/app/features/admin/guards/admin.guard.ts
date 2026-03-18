import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

export const adminGuard: CanActivateFn = (_route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const isCustomersRoute = state.url.startsWith('/admin/customers');

  if (authService.isAdmin()) {
    return true;
  }

  if (isCustomersRoute && authService.hasRole('Agent')) {
    return true;
  }

  return router.createUrlTree(['/dashboard']);
};
