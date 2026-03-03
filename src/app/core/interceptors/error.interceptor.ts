import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { NotificationService } from '../services/notification.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const notificationService = inject(NotificationService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let errorMessage = 'An unexpected error occurred';

      if (error.status === 401) {
        // Don't logout for login endpoint itself
        if (req.url.includes('/api/auth/login')) {
          errorMessage = 'Invalid email or password';
        } else {
          authService.logout();
          errorMessage = 'Session expired. Please login again.';
        }
      } else if (error.error?.error) {
        // Handle structure: { error: "message", statusCode: 500 }
        errorMessage = error.error.error;
      } else if (error.error?.message) {
        // Handle structure: { message: "message" }
        errorMessage = error.error.message;
      } else if (typeof error.error === 'string') {
        errorMessage = error.error;
      } else if (error.status === 0) {
        errorMessage = 'Unable to connect to the server';
      }

      notificationService.showError(errorMessage);
      return throwError(() => error);

    })
  );
};
