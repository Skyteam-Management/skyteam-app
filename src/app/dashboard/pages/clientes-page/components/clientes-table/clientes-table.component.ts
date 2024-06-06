import { Component, OnInit, ViewChild, inject } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { ClientService } from 'src/app/dashboard/services/client.service';
import { Client } from 'src/app/interfaces/client.interface';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { DeleteComponent } from 'src/app/dashboard/components/delete/delete.component';
import Swal from 'sweetalert2';
import { from } from 'rxjs';
import { AddEditClientComponent } from '../add-edit-clientes/add-edit-clientes.component';
import { Lider } from 'src/app/interfaces/lider.interface';
import { LiderService } from 'src/app/dashboard/services/lider.service';

@Component({
  selector: 'app-clientes-table',
  templateUrl: './clientes-table.component.html',
  styleUrls: ['./clientes-table.component.css']
})
export class ClientesTableComponent implements OnInit {
  clientList: Client[] = [];
  lideresList: Lider[] = [];

  displayedColumns: string[] = ['idCliente', 'nombre', 'apellido', 'telefono', 'lider', 'fechaInicio', 'fechaVencimiento', 'estado', 'actions'];
  dataSource: MatTableDataSource<Client> = new MatTableDataSource();

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  private _clientService = inject(ClientService);
  private _liderService = inject(LiderService);
  private _dialog = inject(MatDialog);

  ngOnInit(): void {
    this.getClientes();
    this.getLideres();
  }

  isExpired(fechaInicio: string): boolean {
    const twentyEightDaysAgo = new Date();
    twentyEightDaysAgo.setDate(twentyEightDaysAgo.getDate() - 28);
    return new Date(fechaInicio) < twentyEightDaysAgo;
  }
  
  getClientes(): void {
    this._clientService.getClients()
      .subscribe((res: Client[]) => {
        this.clientList = res.map(client => {
          return {
            ...client,
            fechaInicio: client.fechaInicio ? (typeof client.fechaInicio === 'string' ? client.fechaInicio : new Date((client.fechaInicio as any).seconds * 1000).toString()) : null,
            liderNombre: this.getLiderName(client.lider)
          };
        });
        this.dataSource = new MatTableDataSource(this.clientList);
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;

        // Sobrescribir el método filterPredicate
        this.dataSource.filterPredicate = (data: Client, filter: string) => {
          // Convertir el objeto de datos a una cadena de texto
          const dataStr = data.idCliente + data.nombre + data.apellido + data.liderNombre + data.telefono;
          return dataStr.toLowerCase().includes(filter);
        };
      });
  }

  getLideres(): void {
    this._liderService.getLideres()
      .subscribe((res: Lider[]) => {
        this.lideresList = res;
      })
  }

  getLiderName(id: string): string {
    for (let i = 0; i < this.lideresList.length; i++) {
      if (this.lideresList[i].id === id) {
        return this.lideresList[i].nombre + ' ' + this.lideresList[i].apellido;
      }
    }
    return 'no hay nombre';
  }

  add28Days(fechaInicio: string): string {
    const date = new Date(fechaInicio);
    date.setDate(date.getDate() + 28);
    return date.toISOString().split('T')[0];
  }

  openAddEditForm() {
    const dialogRef = this._dialog.open(AddEditClientComponent, {
      panelClass: 'custom-dialog-container'
    });

    dialogRef.afterClosed().subscribe({
      next: (val) => {
        if (val) {
          this.getClientes();
        }
      }
    }
    );
  }

  openEditForm(data: any) {
    const dialogRef = this._dialog.open(AddEditClientComponent, {
      data: data,
      panelClass: 'custom-dialog-container'
    });

    dialogRef.afterClosed().subscribe({
      next: (val) => {
        if (val) {
          this.getClientes();
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

  deleteClient(row: any) {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.data = {
      title: 'Eliminar',
      name: row.nombre,
      message: '¿Estás seguro que deseas eliminar este cliente?'
    };
    dialogConfig.panelClass = 'custom-dialog-container';

    const dialogRef = this._dialog.open(DeleteComponent, dialogConfig);

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this._clientService.deleteClient(row.id).then(() => {
          this.getClientes();
        }).catch((err: any) => {
          Swal.fire('Error', 'Ha ocurrido un error al eliminar el cliente', 'error');
        });
      }
    });
  }
}

