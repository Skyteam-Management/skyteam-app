import { Component, inject } from '@angular/core';
import { Dialog } from '@angular/cdk/dialog';
import { LucideDynamicIcon, LucidePlus } from '@lucide/angular';
import { AddEditLiderComponent } from './components/add-edit-lideres/add-edit-lideres.component';
import { LideresTableComponent } from './components/lideres-table/lideres-table.component';

@Component({
  selector: 'app-lideres-page',
  templateUrl: './lideres-page.component.html',
  imports: [LideresTableComponent, LucideDynamicIcon],
})
export class LideresPageComponent {
  private dialog = inject(Dialog);

  readonly Plus = LucidePlus;

  openAddForm() {
    this.dialog.open(AddEditLiderComponent);
  }
}
