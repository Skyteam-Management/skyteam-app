import { Component, OnInit, ViewChild, inject } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { LiderService } from 'src/app/dashboard/services/lider.service';
import { Lider } from 'src/app/interfaces/lider.interface';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { DeleteComponent } from 'src/app/dashboard/components/delete/delete.component';
import Swal from 'sweetalert2';
import { from } from 'rxjs';
import { AddEditLiderComponent } from '../add-edit-lideres/add-edit-lideres.component';

@Component({
  selector: 'app-lideres-table',
  templateUrl: './lideres-table.component.html',
  styleUrls: ['./lideres-table.component.css']
})
export class LideresTableComponent implements OnInit {
  liderList: Lider[] = [];

  displayedColumns: string[] = ['nombre', 'apellido', 'actions'];
  dataSource: MatTableDataSource<Lider> = new MatTableDataSource();

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  private _liderService = inject(LiderService);
  private _dialog = inject(MatDialog);

  ngOnInit(): void {
    this.getLideres();
  }

  getLideres(): void {
    this._liderService.getLideres()
      .subscribe((res: Lider[]) => {
        this.liderList = res;
        this.dataSource = new MatTableDataSource(this.liderList);
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
      });
  }

  openAddEditForm() {
    const dialogRef = this._dialog.open(AddEditLiderComponent, {
      panelClass: 'custom-dialog-container'
    });

    dialogRef.afterClosed().subscribe({
      next: (val) => {
        if (val) {
          this.getLideres();
        }
      }
    });
  }

  openEditForm(data: any) {
    const dialogRef = this._dialog.open(AddEditLiderComponent, {
      data: data,
      panelClass: 'custom-dialog-container'
    });

    console.log(data);
    

    dialogRef.afterClosed().subscribe({
      next: (val) => {
        if (val) {
          this.getLideres();
        }
      }
    });
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  deleteLider(row: any) {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.data = {
      title: 'Eliminar',
      name: row.nombre,
      message: '¿Estás seguro que deseas eliminar este líder?'
    };
    dialogConfig.panelClass = 'custom-dialog-container';

    const dialogRef = this._dialog.open(DeleteComponent, dialogConfig);

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this._liderService.deleteLider(row.id).then(() => {
          this.getLideres();
        }).catch((err: any) => {
          Swal.fire('Error', 'Ha ocurrido un error al eliminar el líder', 'error');
        });
      }
    });
  }
}