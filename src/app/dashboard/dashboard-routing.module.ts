import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardLayoutComponent } from './layout/dashboard-layout/dashboard-layout.component';
import { OptionPageComponent } from './pages/option-page/option-page.component';
import { ClientesPageComponent } from './pages/clientes-page/clientes-page.component';
import { LideresPageComponent } from './pages/lideres-page/lideres-page.component';

const routes: Routes = [
  {
    path: '',
    component: DashboardLayoutComponent,
    children: [
      { path: 'opciones', component: OptionPageComponent },
      { path: 'clientes', component: ClientesPageComponent },
      { path: 'patrocinadores', component: LideresPageComponent },
      { path: '**', redirectTo: 'opciones' }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DashboardRoutingModule { }
