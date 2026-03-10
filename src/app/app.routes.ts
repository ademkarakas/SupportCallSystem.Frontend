import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './features/admin/guards/admin.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'forgot-password',
    loadComponent: () =>
      import('./features/auth/forgot-password.component').then((m) => m.ForgotPasswordComponent),
  },
  {
    path: 'reset-password',
    loadComponent: () =>
      import('./features/auth/reset-password.component').then((m) => m.ResetPasswordComponent),
  },
  {
    path: 'two-factor-verify',
    loadComponent: () =>
      import('./features/auth/two-factor-verify.component').then((m) => m.TwoFactorVerifyComponent),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/dashboard/main-layout.component').then((m) => m.MainLayoutComponent),
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard-landing.component').then(
            (m) => m.DashboardComponent,
          ),
      },
      {
        path: 'quick-access',
        loadComponent: () =>
          import('./features/dashboard/quick-access.component').then((m) => m.QuickAccessComponent),
      },
      {
        path: 'calls',
        loadChildren: () => import('./features/calls/calls.routes').then((m) => m.CALLS_ROUTES),
      },
      {
        path: 'reports',
        loadComponent: () =>
          import('./features/reports/reports.component').then((m) => m.ReportsComponent),
      },
      {
        path: 'notifications',
        loadComponent: () =>
          import('./features/notifications/notification-inbox.component').then(
            (m) => m.NotificationInboxComponent,
          ),
      },
      {
        path: 'admin',
        canActivate: [adminGuard],
        loadChildren: () => import('./features/admin/admin.routes').then((m) => m.ADMIN_ROUTES),
      },
      {
        path: 'settings/security',
        loadComponent: () =>
          import('./features/auth/two-factor-setup.component').then(
            (m) => m.TwoFactorSetupComponent,
          ),
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'dashboard',
  },
];
