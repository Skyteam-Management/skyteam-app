import { Component, effect, inject, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatButton } from '@angular/material/button';
import { Lider } from 'src/app/interfaces/lider.interface';
import { LiderService } from '../../services/lider.service';
import { AddEditLiderComponent } from './components/add-edit-lideres/add-edit-lideres.component';
import { LideresTableComponent } from './components/lideres-table/lideres-table.component';

@Component({
  selector: 'app-lideres-page',
  templateUrl: './lideres-page.component.html',
  styleUrls: ['./lideres-page.component.css'],
  imports: [MatButton, LideresTableComponent],
})
export class LideresPageComponent {
  displayedColumns: string[] = ['nombre', 'apellido', 'editar'];

  private liderService = inject(LiderService);
  private dialog = inject(MatDialog);

  readonly liderData = signal<Lider[]>([]);

  constructor() {
    effect(() => {
      this.liderData.set(this.liderService.lideres());
    });
  }

  openAddForm() {
    this.dialog.open(AddEditLiderComponent, {
      panelClass: 'custom-dialog-container',
    });
  }
}
