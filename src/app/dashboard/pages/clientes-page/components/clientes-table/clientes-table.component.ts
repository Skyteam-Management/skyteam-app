import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Dialog } from '@angular/cdk/dialog';
import { LucideDynamicIcon, LucideArrowUpDown, LucideArrowUp, LucideArrowDown, LucidePencil, LucideTrash2, LucideSearch, LucideChevronLeft, LucideChevronRight } from '@lucide/angular';
import Swal from 'sweetalert2';
import { ClientService } from 'src/app/dashboard/services/client.service';
import { DeleteComponent } from 'src/app/dashboard/components/delete/delete.component';
import { Client } from 'src/app/interfaces/client.interface';
import { AddEditClientComponent } from '../add-edit-clientes/add-edit-clientes.component';

type SortColumn = 'nombre' | 'telefono' | 'liderNombre' | 'fechaInicio' | 'fechaVencimiento' | 'paquete' | 'estado';
type SortDir = 'asc' | 'desc';

@Component({
  selector: 'app-clientes-table',
  templateUrl: './clientes-table.component.html',
  imports: [DatePipe, LucideDynamicIcon],
})
export class ClientesTableComponent {
  private _clientService = inject(ClientService);
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

  private readonly filtered = computed(() => {
    const q = this.filter().trim().toLowerCase();
    const rows = this._clientService.clients();
    if (!q) return rows;
    return rows.filter((row) => {
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

  openEditForm(row: Client) {
    this._dialog.open(AddEditClientComponent, { data: row });
  }

  deleteClient(row: Client) {
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

  private sortValue(row: Client, col: SortColumn): string | number {
    switch (col) {
      case 'fechaInicio': return toTime(row.fechaInicio);
      case 'fechaVencimiento': return toTime(row.fechaVencimiento);
      case 'estado': return row.expirado ? 1 : 0;
      case 'paquete': return (row.paqueteNombre ?? '').toLowerCase();
      case 'liderNombre': return (row.liderNombre ?? '').toLowerCase();
      default: return (row[col] ?? '').toString().toLowerCase();
    }
  }
}

function toTime(v: string | Date | null | undefined): number {
  if (!v) return 0;
  const d = v instanceof Date ? v : new Date(v);
  const t = d.getTime();
  return isNaN(t) ? 0 : t;
}
