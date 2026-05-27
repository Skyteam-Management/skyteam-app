import { Routes } from '@angular/router';
import { DashboardLayoutComponent } from './layout/dashboard-layout/dashboard-layout.component';
import { OptionPageComponent } from './pages/option-page/option-page.component';
import { ClientesPageComponent } from './pages/clientes-page/clientes-page.component';
import { LideresPageComponent } from './pages/lideres-page/lideres-page.component';
import { PaquetesPageComponent } from './pages/paquetes-page/paquetes-page.component';
import { HistorialPageComponent } from './pages/historial-page/historial-page.component';

export const DASHBOARD_ROUTES: Routes = [
  {
    path: '',
    component: DashboardLayoutComponent,
    children: [
      { path: 'opciones', component: OptionPageComponent },
      { path: 'clientes', component: ClientesPageComponent },
      { path: 'patrocinadores', component: LideresPageComponent },
      { path: 'paquetes', component: PaquetesPageComponent },
      { path: 'historial', component: HistorialPageComponent },
      { path: '**', redirectTo: 'opciones' },
    ],
  },
];
