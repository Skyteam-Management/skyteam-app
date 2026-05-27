import { AfterViewInit, Component, ViewChild, effect, inject } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort, MatSortHeader } from '@angular/material/sort';
import {
  MatTableDataSource,
  MatTable,
  MatColumnDef,
  MatHeaderCellDef,
  MatHeaderCell,
  MatCellDef,
  MatCell,
  MatHeaderRowDef,
  MatHeaderRow,
  MatRowDef,
  MatRow,
  MatNoDataRow,
} from '@angular/material/table';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatIcon } from '@angular/material/icon';
import Swal from 'sweetalert2';
import { LiderService } from 'src/app/dashboard/services/lider.service';
import { DeleteComponent } from 'src/app/dashboard/components/delete/delete.component';
import { Lider } from 'src/app/interfaces/lider.interface';
import { AddEditLiderComponent } from '../add-edit-lideres/add-edit-lideres.component';

@Component({
  selector: 'app-lideres-table',
  templateUrl: './lideres-table.component.html',
  styleUrls: ['./lideres-table.component.css'],
  imports: [
    MatFormField,
    MatLabel,
    MatInput,
    MatTable,
    MatSort,
    MatColumnDef,
    MatHeaderCellDef,
    MatHeaderCell,
    MatSortHeader,
    MatCellDef,
    MatCell,
    MatIcon,
    MatHeaderRowDef,
    MatHeaderRow,
    MatRowDef,
    MatRow,
    MatNoDataRow,
    MatPaginator,
  ],
})
export class LideresTableComponent implements AfterViewInit {
  displayedColumns: string[] = ['nombre', 'apellido', 'actions'];
  dataSource = new MatTableDataSource<Lider>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  private _liderService = inject(LiderService);
  private _dialog = inject(MatDialog);

  constructor() {
    effect(() => {
      this.dataSource.data = this._liderService.lideres();
    });
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  openAddEditForm() {
    this._dialog.open(AddEditLiderComponent, { panelClass: 'custom-dialog-container' });
  }

  openEditForm(data: any) {
    this._dialog.open(AddEditLiderComponent, { data, panelClass: 'custom-dialog-container' });
  }

  applyFilter(event: Event) {
    this.dataSource.filter = (event.target as HTMLInputElement).value.trim().toLowerCase();
    this.dataSource.paginator?.firstPage();
  }

  deleteLider(row: any) {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.data = { title: 'Eliminar', name: row.nombre, message: '¿Estás seguro que deseas eliminar este líder?' };
    dialogConfig.panelClass = 'custom-dialog-container';

    this._dialog.open(DeleteComponent, dialogConfig).afterClosed().subscribe((result) => {
      if (result) {
        this._liderService.deleteLider(row.id).catch(() => {
          Swal.fire('Error', 'Ha ocurrido un error al eliminar el líder', 'error');
        });
      }
    });
  }
}
