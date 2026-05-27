import { AfterViewInit, Component, ViewChild, computed, effect, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
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
import { ClientService } from 'src/app/dashboard/services/client.service';
import { LiderService } from 'src/app/dashboard/services/lider.service';
import { DeleteComponent } from 'src/app/dashboard/components/delete/delete.component';
import { Client } from 'src/app/interfaces/client.interface';
import { Lider } from 'src/app/interfaces/lider.interface';
import { PAQUETES } from 'src/app/dashboard/shared/constants/paquetes.constants';
import { AddEditClientComponent } from '../add-edit-clientes/add-edit-clientes.component';

@Component({
  selector: 'app-clientes-table',
  templateUrl: './clientes-table.component.html',
  styleUrls: ['./clientes-table.component.css'],
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
    DatePipe,
  ],
})
export class ClientesTableComponent implements AfterViewInit {
  paquetes = PAQUETES;

  displayedColumns: string[] = ['nombre', 'telefono', 'lider', 'fechaInicio', 'fechaVencimiento', 'paquete', 'estado', 'actions'];
  dataSource = new MatTableDataSource<Client>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  private _clientService = inject(ClientService);
  private _liderService = inject(LiderService);
  private _dialog = inject(MatDialog);

  private readonly enrichedClients = computed(() => {
    const lideres = this._liderService.lideres();
    const liderById = new Map(lideres.map((l) => [l.id, l] as const));
    return this._clientService.clients().map((client) => ({
      ...client,
      fechaInicio: client.fechaInicio
        ? typeof client.fechaInicio === 'string'
          ? client.fechaInicio
          : new Date((client.fechaInicio as any).seconds * 1000).toString()
        : null,
      liderNombre: this.formatLiderName(liderById.get(client.lider)),
    }));
  });

  constructor() {
    this.dataSource.filterPredicate = (data, filter) => {
      const dataStr = (data.nombre ?? '') + (data.liderNombre ?? '') + (data.telefono ?? '');
      return dataStr.toLowerCase().includes(filter);
    };

    effect(() => {
      this.dataSource.data = this.enrichedClients();
    });
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  isExpired(fechaInicio: string, paqueteId: number): boolean {
    const fechaVencimiento = new Date(fechaInicio);
    fechaVencimiento.setDate(fechaVencimiento.getDate() + this.getPaqueteDuration(paqueteId));
    return fechaVencimiento < new Date();
  }

  getLiderName(id: string): string {
    return this.formatLiderName(this._liderService.lideres().find((l) => l.id === id));
  }

  getPaqueteName(paqueteId: number): string {
    const paquete = this.paquetes.find((p) => String(p.id) === String(paqueteId));
    return paquete ? paquete.nombre : 'Desconocido';
  }

  getPaqueteDuration(paqueteId: number): number {
    const paquete = this.paquetes.find((p) => String(p.id) === String(paqueteId));
    switch (paquete?.nombre) {
      case '1 MES': return 31;
      case '2 MESES': return 60;
      case '3 MESES': return 91;
      case '4 MESES': return 121;
      case '5 MESES': return 151;
      case '6 MESES': return 182;
      case '7 MESES': return 212;
      case '8 MESES': return 243;
      case '9 MESES': return 273;
      case '10 MESES': return 304;
      case '11 MESES': return 334;
      case '12 MESES': return 365;
      case '15 DÍAS': return 15;
      case '8 DÍAS': return 8;
      default: return 0;
    }
  }

  calculateFechaVencimiento(fechaInicio: Date, paqueteId: number): Date {
    const result = new Date(fechaInicio);
    result.setDate(result.getDate() + this.getPaqueteDuration(paqueteId));
    return result;
  }

  openAddEditForm() {
    this._dialog.open(AddEditClientComponent, { panelClass: 'custom-dialog-container' });
  }

  openEditForm(data: any) {
    this._dialog.open(AddEditClientComponent, { data, panelClass: 'custom-dialog-container' });
  }

  applyFilter(event: Event) {
    this.dataSource.filter = (event.target as HTMLInputElement).value.trim().toLowerCase();
    this.dataSource.paginator?.firstPage();
  }

  deleteClient(row: any) {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.data = { title: 'Eliminar', name: row.nombre, message: '¿Estás seguro que deseas eliminar este cliente?' };
    dialogConfig.panelClass = 'custom-dialog-container';

    this._dialog.open(DeleteComponent, dialogConfig).afterClosed().subscribe((result) => {
      if (result) {
        this._clientService.deleteClient(row.id).catch(() => {
          Swal.fire('Error', 'Ha ocurrido un error al eliminar el cliente', 'error');
        });
      }
    });
  }

  private formatLiderName(lider: Lider | undefined): string {
    return lider ? `${lider.nombre} ${lider.apellido}` : 'no hay nombre';
  }
}
