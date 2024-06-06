import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './auth/guards/auth.guard';
import { LoginGuard } from './auth/guards/login.guard';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'auth',
    pathMatch: 'full'
  },
  {
    path: 'auth',
    loadChildren: () => import('./auth/auth.module').then(m => m.AuthModule),
    canActivate: [LoginGuard]
  },
  {
    path: 'dashboard',
    loadChildren: () => import('./dashboard/dashboard.module').then(m => m.DashboardModule),
    canActivate: [AuthGuard]
  },
  { path: 'module/auth/modules/material', loadChildren: () => import('./auth/modules/material/material.module').then(m => m.MaterialModule) },
  {
    path: '**',
    redirectTo: 'auth',
    pathMatch: 'full'
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
