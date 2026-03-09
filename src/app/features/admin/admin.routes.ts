import { Routes } from '@angular/router';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'users',
    pathMatch: 'full',
  },
  {
    path: 'users',
    loadComponent: () =>
      import('./components/users-list/users-list.component').then((m) => m.UsersListComponent),
  },
  {
    path: 'users/new',
    loadComponent: () =>
      import('./components/user-edit/user-edit.component').then((m) => m.UserEditComponent),
  },
  {
    path: 'users/:id/edit',
    loadComponent: () =>
      import('./components/user-edit/user-edit.component').then((m) => m.UserEditComponent),
  },
  {
    path: 'customers',
    loadComponent: () =>
      import('./components/customers-list/customers-list.component').then(
        (m) => m.CustomersListComponent,
      ),
  },
  {
    path: 'customers/new',
    loadComponent: () =>
      import('./components/customer-edit/customer-edit.component').then(
        (m) => m.CustomerEditComponent,
      ),
  },
  {
    path: 'customers/:id/edit',
    loadComponent: () =>
      import('./components/customer-edit/customer-edit.component').then(
        (m) => m.CustomerEditComponent,
      ),
  },
  {
    path: 'activity',
    loadComponent: () =>
      import('./components/agent-activity/agent-activity.component').then(
        (m) => m.AgentActivityComponent,
      ),
  },
];
