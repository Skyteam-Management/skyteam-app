import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { Lider } from 'src/app/interfaces/lider.interface';
import { LiderService } from '../../services/lider.service';
import { DatePipe } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { AddEditLiderComponent } from './components/add-edit-lideres/add-edit-lideres.component';

@Component({
  selector: 'app-lideres-page',
  templateUrl: './lideres-page.component.html',
  styleUrls: ['./lideres-page.component.css'],
  providers: [DatePipe]
})
export class LideresPageComponent {

  columnNames = {
    'nombre': 'Nombre',
    'apellido': 'Apellido',
    'editar': 'Modificar'
  };

  displayedColumns: string[] = ['nombre', 'apellido', 'editar'];

  liderData: Lider[] = [];

  private dialog = inject(MatDialog)

  constructor(
    private _liderService: LiderService,
    private datePipe: DatePipe,
    private cdr: ChangeDetectorRef  // Inject ChangeDetectorRef
  ) {
    this.loadLiderData();
  }

  loadLiderData() {
    this._liderService.getLideres().subscribe(lideres => {
      this.liderData = lideres.map(lider => ({
        ...lider,
      }));
      this.cdr.detectChanges();
      if (this.liderData.length > 0) {
        console.log('Hay datos de líderes:', this.liderData);
      } else {
        console.log('No hay datos de líderes');
      }
    });
  }

  timestampToDate(timestamp: any): string | null {
    if (timestamp && timestamp.seconds) {
      const date = new Date(timestamp.seconds * 1000);
      return this.datePipe.transform(date, 'MMM d, y') || null;
    }
    return null;
  }

  openAddForm() {
    const dialogRef = this.dialog.open(AddEditLiderComponent, {
      panelClass: 'custom-dialog-container'
    });
    dialogRef.afterClosed().subscribe({
      next: (val) => {
        if (val) {
          this.loadLiderData();
        }
      }
    });
  }
}