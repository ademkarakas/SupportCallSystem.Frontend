import { Routes } from '@angular/router';

export const CALLS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/call-view/call-view.component').then((m) => m.CallViewComponent),
  },
  {
    path: 'history',
    loadComponent: () =>
      import('./components/call-history/call-history.component').then(
        (m) => m.CallHistoryComponent,
      ),
  },
  {
    path: 'detail',
    loadComponent: () =>
      import('./components/call-detail/call-detail.component').then((m) => m.CallDetailComponent),
  },
  {
    path: 'customers',
    loadComponent: () =>
      import('./components/customer-list/customer-list.component').then(
        (m) => m.CallCustomersListComponent,
      ),
  },
  {
    path: 'caller-profile',
    loadComponent: () =>
      import('./components/caller-profile/caller-profile.component').then(
        (m) => m.CallerProfileComponent,
      ),
  },
];
