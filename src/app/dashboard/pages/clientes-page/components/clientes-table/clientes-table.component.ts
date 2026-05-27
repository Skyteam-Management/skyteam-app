import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Dialog } from '@angular/cdk/dialog';
import { LucideDynamicIcon, LucideArrowUpDown, LucideArrowUp, LucideArrowDown, LucidePencil, LucideTrash2, LucideSearch, LucideChevronLeft, LucideChevronRight } from '@lucide/angular';
import Swal from 'sweetalert2';
import { ClientService } from 'src/app/dashboard/services/client.service';
import { LiderService } from 'src/app/dashboard/services/lider.service';
import { DeleteComponent } from 'src/app/dashboard/components/delete/delete.component';
import { PAQUETES } from 'src/app/dashboard/shared/constants/paquetes.constants';
import { Client } from 'src/app/interfaces/client.interface';
import { Lider } from 'src/app/interfaces/lider.interface';
import { AddEditClientComponent } from '../add-edit-clientes/add-edit-clientes.component';

type SortColumn = 'nombre' | 'telefono' | 'liderNombre' | 'fechaInicio' | 'fechaVencimiento' | 'paquete' | 'estado';
type SortDir = 'asc' | 'desc';

interface ClientRow extends Client {
  liderNombre: string;
  paqueteNombre: string;
  fechaVencimiento: Date | null;
  expirado: boolean;
}

@Component({
  selector: 'app-clientes-table',
  templateUrl: './clientes-table.component.html',
  imports: [DatePipe, LucideDynamicIcon],
})
export class ClientesTableComponent {
  private _clientService = inject(ClientService);
  private _liderService = inject(LiderService);
  private _dialog = inject(Dialog);

  readonly ArrowUpDown = LucideArrowUpDown;
  readonly ArrowUp = LucideArrowUp;
  readonly ArrowDown = LucideArrowDown;
  readonly Pencil = LucidePencil;
  readonly Trash2 = LucideTrash2;
  readonly Search = LucideSearch;
  readonly ChevronLeft = LucideChevronLeft;
  readonly ChevronRight = LucideChevronRight;

  readonly filter = signal('');
  readonly sortColumn = signal<SortColumn | null>('nombre');
  readonly sortDir = signal<SortDir>('asc');
  readonly page = signal(0);
  readonly pageSize = signal(10);
  readonly pageSizeOptions = [5, 10, 20, 50];

  private readonly enriched = computed<ClientRow[]>(() => {
    const liderById = new Map(this._liderService.lideres().map((l) => [l.id, l] as const));
    return this._clientService.clients().map((c) => {
      const lider = liderById.get(c.lider);
      const fechaInicioDate = this.toDate(c.fechaInicio);
      const duration = this.getPaqueteDuration(c.paquete);
      const fechaVencimiento = fechaInicioDate ? new Date(fechaInicioDate.getTime() + duration * 24 * 60 * 60 * 1000) : null;
      return {
        ...c,
        liderNombre: this.formatLider(lider),
        paqueteNombre: this.getPaqueteName(c.paquete),
        fechaVencimiento,
        expirado: fechaVencimiento ? fechaVencimiento < new Date() : false,
      };
    });
  });

  private readonly filtered = computed(() => {
    const q = this.filter().trim().toLowerCase();
    if (!q) return this.enriched();
    return this.enriched().filter((row) => {
      const blob = `${row.nombre ?? ''} ${row.telefono ?? ''} ${row.liderNombre ?? ''}`.toLowerCase();
      return blob.includes(q);
    });
  });

  private readonly sorted = computed(() => {
    const col = this.sortColumn();
    const dir = this.sortDir() === 'asc' ? 1 : -1;
    if (!col) return this.filtered();
    return [...this.filtered()].sort((a, b) => {
      const av = this.sortValue(a, col);
      const bv = this.sortValue(b, col);
      if (av < bv) return -1 * dir;
      if (av > bv) return 1 * dir;
      return 0;
    });
  });

  readonly totalRows = computed(() => this.sorted().length);
  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.totalRows() / this.pageSize())));
  readonly paged = computed(() => {
    const start = this.page() * this.pageSize();
    return this.sorted().slice(start, start + this.pageSize());
  });
  readonly pageStart = computed(() => (this.totalRows() === 0 ? 0 : this.page() * this.pageSize() + 1));
  readonly pageEnd = computed(() => Math.min(this.totalRows(), (this.page() + 1) * this.pageSize()));

  onFilterChange(event: Event) {
    this.filter.set((event.target as HTMLInputElement).value);
    this.page.set(0);
  }

  toggleSort(column: SortColumn) {
    if (this.sortColumn() === column) {
      this.sortDir.update((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      this.sortColumn.set(column);
      this.sortDir.set('asc');
    }
  }

  changePageSize(event: Event) {
    this.pageSize.set(+(event.target as HTMLSelectElement).value);
    this.page.set(0);
  }

  prevPage() {
    this.page.update((p) => Math.max(0, p - 1));
  }

  nextPage() {
    this.page.update((p) => Math.min(this.totalPages() - 1, p + 1));
  }

  openAddEditForm() {
    this._dialog.open(AddEditClientComponent);
  }

  openEditForm(row: ClientRow) {
    this._dialog.open(AddEditClientComponent, { data: row });
  }

  deleteClient(row: ClientRow) {
    const ref = this._dialog.open<boolean>(DeleteComponent, {
      data: { title: 'Eliminar', name: row.nombre, message: '¿Estás seguro que deseas eliminar este cliente?' },
    });
    ref.closed.subscribe((result) => {
      if (result) {
        this._clientService.deleteClient(row.id!).catch(() => {
          Swal.fire('Error', 'Ha ocurrido un error al eliminar el cliente', 'error');
        });
      }
    });
  }

  private sortValue(row: ClientRow, col: SortColumn): string | number {
    switch (col) {
      case 'fechaInicio': return this.toDate(row.fechaInicio)?.getTime() ?? 0;
      case 'fechaVencimiento': return row.fechaVencimiento?.getTime() ?? 0;
      case 'estado': return row.expirado ? 1 : 0;
      case 'paquete': return row.paqueteNombre.toLowerCase();
      default: return (row[col] ?? '').toString().toLowerCase();
    }
  }

  private toDate(v: string | Date | null | undefined): Date | null {
    if (!v) return null;
    if (v instanceof Date) return v;
    const d = new Date(v);
    return isNaN(d.getTime()) ? null : d;
  }

  private formatLider(lider: Lider | undefined): string {
    return lider ? `${lider.nombre} ${lider.apellido}` : '—';
  }

  private getPaqueteName(paqueteId: any): string {
    const p = PAQUETES.find((x) => String(x.id) === String(paqueteId));
    return p ? p.nombre : 'Desconocido';
  }

  private getPaqueteDuration(paqueteId: any): number {
    const p = PAQUETES.find((x) => String(x.id) === String(paqueteId));
    switch (p?.nombre) {
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
}
