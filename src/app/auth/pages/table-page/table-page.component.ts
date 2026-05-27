import { AfterViewInit, Component, ViewChild, computed, effect, inject } from '@angular/core';
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
import { MatButton } from '@angular/material/button';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { RouterLink } from '@angular/router';
import { ClientService } from 'src/app/dashboard/services/client.service';
import { LiderService } from 'src/app/dashboard/services/lider.service';
import { Client } from 'src/app/interfaces/client.interface';
import { Lider } from 'src/app/interfaces/lider.interface';

@Component({
  selector: 'app-table-page',
  templateUrl: './table-page.component.html',
  styleUrls: ['./table-page.component.css'],
  imports: [
    MatButton,
    RouterLink,
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
    MatHeaderRowDef,
    MatHeaderRow,
    MatRowDef,
    MatRow,
    MatNoDataRow,
    MatPaginator,
  ],
})
export class TablePageComponent implements AfterViewInit {
  displayedColumns: string[] = ['idCliente', 'nombre', 'apellido', 'lider', 'estado'];
  dataSource = new MatTableDataSource<Client>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  private _clientService = inject(ClientService);
  private _liderService = inject(LiderService);

  private readonly enrichedClients = computed(() => {
    const liderById = new Map(this._liderService.lideres().map((l) => [l.id, l] as const));
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
      const dataStr = (data.nombre ?? '') + (data.liderNombre ?? '');
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

  isExpired(fechaInicio: string): boolean {
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    return new Date(fechaInicio) < oneMonthAgo;
  }

  applyFilter(event: Event) {
    this.dataSource.filter = (event.target as HTMLInputElement).value.trim().toLowerCase();
    this.dataSource.paginator?.firstPage();
  }

  private formatLiderName(lider: Lider | undefined): string {
    return lider ? `${lider.nombre} ${lider.apellido}` : 'no hay nombre';
  }
}
