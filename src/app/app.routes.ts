import { Routes } from '@angular/router';
import { AuthGuard } from './auth/guards/auth.guard';
import { LoginGuard } from './auth/guards/login.guard';

export const APP_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'auth',
    pathMatch: 'full',
  },
  {
    path: 'auth',
    loadChildren: () => import('./auth/auth.routes').then((m) => m.AUTH_ROUTES),
    canActivate: [LoginGuard],
  },
  {
    path: 'dashboard',
    loadChildren: () =>
      import('./dashboard/dashboard.routes').then((m) => m.DASHBOARD_ROUTES),
    canActivate: [AuthGuard],
  },
  {
    path: '**',
    redirectTo: 'auth',
    pathMatch: 'full',
  },
];
