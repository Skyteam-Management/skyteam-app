import { Component, ViewChild, inject } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { ClientService } from 'src/app/dashboard/services/client.service';
import { LiderService } from 'src/app/dashboard/services/lider.service';
import { Client } from 'src/app/interfaces/client.interface';
import { Lider } from 'src/app/interfaces/lider.interface';

@Component({
  selector: 'app-table-page',
  templateUrl: './table-page.component.html',
  styleUrls: ['./table-page.component.css']
})
export class TablePageComponent {
  clientList: Client[] = [];
  lideresList: Lider[] = [];

  displayedColumns: string[] = ['idCliente', 'nombre', 'apellido', 'lider', 'estado'];
  dataSource: MatTableDataSource<Client> = new MatTableDataSource();

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  private _clientService = inject(ClientService);
  private _liderService = inject(LiderService);

  ngOnInit(): void {
    this.getClientes();
    this.getLideres();
  }

  isExpired(fechaInicio: string): boolean {
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    return new Date(fechaInicio) < oneMonthAgo;
  }

  getClientes(): void {
    this._clientService.getClients()
      .subscribe((res: Client[]) => {
        this.clientList = res.map(client => {
          return {
            ...client,
            // Convertir el timestamp de fechaInicio a una fecha
            fechaInicio: client.fechaInicio ? (typeof client.fechaInicio === 'string' ? client.fechaInicio : new Date((client.fechaInicio as any).seconds * 1000).toString()) : null,
            // Añadir el nombre del líder al objeto del cliente
            liderNombre: this.getLiderName(client.lider)
          };
        });
        this.dataSource = new MatTableDataSource(this.clientList);
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
  
        // Sobrescribir el método filterPredicate
        this.dataSource.filterPredicate = (data: Client, filter: string) => {
          // Convertir el objeto de datos a una cadena de texto
          const dataStr = data.idCliente + data.nombre + data.apellido + data.liderNombre;
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


  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }
}
