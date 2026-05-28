import { Component, inject } from '@angular/core';
import { Dialog } from '@angular/cdk/dialog';
import { LucideDynamicIcon, LucidePlus } from '@lucide/angular';
import { AddEditClientComponent } from './components/add-edit-clientes/add-edit-clientes.component';
import { ClientesTableComponent } from './components/clientes-table/clientes-table.component';

@Component({
  selector: 'app-clientes-page',
  templateUrl: './clientes-page.component.html',
  imports: [ClientesTableComponent, LucideDynamicIcon],
})
export class ClientesPageComponent {
  private dialog = inject(Dialog);

  readonly Plus = LucidePlus;

  openAddForm() {
    this.dialog.open(AddEditClientComponent);
  }
}
