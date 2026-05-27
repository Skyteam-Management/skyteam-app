import { Component, inject } from '@angular/core';
import { Dialog } from '@angular/cdk/dialog';
import { LucideDynamicIcon, LucidePlus } from '@lucide/angular';
import { AddEditPaqueteComponent } from './components/add-edit-paquetes/add-edit-paquetes.component';
import { PaquetesTableComponent } from './components/paquetes-table/paquetes-table.component';

@Component({
  selector: 'app-paquetes-page',
  templateUrl: './paquetes-page.component.html',
  imports: [PaquetesTableComponent, LucideDynamicIcon],
})
export class PaquetesPageComponent {
  private dialog = inject(Dialog);

  readonly Plus = LucidePlus;

  openAddForm() {
    this.dialog.open(AddEditPaqueteComponent);
  }
}
