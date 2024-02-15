import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DashboardRoutingModule } from './dashboard-routing.module';
import { DashboardLayoutComponent } from './layout/dashboard-layout/dashboard-layout.component';
import { OptionPageComponent } from './pages/option-page/option-page.component';
import { LideresPageComponent } from './pages/lideres-page/lideres-page.component';
import { ClientesPageComponent } from './pages/clientes-page/clientes-page.component';
import { NavbarComponent } from './shared/components/navbar/navbar.component';
import { MaterialModule } from './modules/material/material.module';
import { ClientesTableComponent } from './pages/clientes-page/components/clientes-table/clientes-table.component';
import { DeleteComponent } from './components/delete/delete.component';
import { AddEditClientComponent } from './pages/clientes-page/components/add-edit-clientes/add-edit-clientes.component';
import { ReactiveFormsModule } from '@angular/forms';
import { LideresTableComponent } from './pages/lideres-page/components/lideres-table/lideres-table.component';
import { AddEditLiderComponent } from './pages/lideres-page/components/add-edit-lideres/add-edit-lideres.component';



@NgModule({
  declarations: [
    DashboardLayoutComponent,
    OptionPageComponent,
    LideresPageComponent,
    ClientesPageComponent,
    NavbarComponent,
    ClientesTableComponent,
    AddEditClientComponent,
    DeleteComponent,
    LideresTableComponent,
    AddEditLiderComponent
  ],
  imports: [
    ReactiveFormsModule,
    CommonModule,
    DashboardRoutingModule,
    MaterialModule
  ]
})
export class DashboardModule { }
