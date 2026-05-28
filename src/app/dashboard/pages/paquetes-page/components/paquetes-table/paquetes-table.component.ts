import { Component, computed, inject, signal } from '@angular/core';
import { Dialog } from '@angular/cdk/dialog';
import { LucideDynamicIcon, LucideArrowUpDown, LucideArrowUp, LucideArrowDown, LucidePencil, LucideTrash2, LucideSearch, LucideChevronLeft, LucideChevronRight } from '@lucide/angular';
import { PaqueteService } from 'src/app/dashboard/services/paquete.service';
import { ClientService } from 'src/app/dashboard/services/client.service';
import { ToastService } from 'src/app/shared/services/toast.service';
import { DeleteComponent } from 'src/app/dashboard/components/delete/delete.component';
import { Paquete } from 'src/app/interfaces/paquete.interface';
import { AddEditPaqueteComponent } from '../add-edit-paquetes/add-edit-paquetes.component';

type SortColumn = 'nombre' | 'dias' | 'activo' | 'enUso';
type SortDir = 'asc' | 'desc';

interface PaqueteRow extends Paquete {
  enUso: number;
}

@Component({
  selector: 'app-paquetes-table',
  templateUrl: './paquetes-table.component.html',
  imports: [LucideDynamicIcon],
})
export class PaquetesTableComponent {
  private _paqueteService = inject(PaqueteService);
  private _clientService = inject(ClientService);
  private _dialog = inject(Dialog);
  private _toast = inject(ToastService);

  readonly ArrowUpDown = LucideArrowUpDown;
  readonly ArrowUp = LucideArrowUp;
  readonly ArrowDown = LucideArrowDown;
  readonly Pencil = LucidePencil;
  readonly Trash2 = LucideTrash2;
  readonly Search = LucideSearch;
  readonly ChevronLeft = LucideChevronLeft;
  readonly ChevronRight = LucideChevronRight;

  readonly filter = signal('');
  readonly sortColumn = signal<SortColumn | null>('dias');
  readonly sortDir = signal<SortDir>('desc');
  readonly page = signal(0);
  readonly pageSize = signal(10);
  readonly pageSizeOptions = [5, 10, 20, 50];

  private readonly enriched = computed<PaqueteRow[]>(() => {
    const counts = new Map<string, number>();
    for (const c of this._clientService.clients()) {
      if (!c.paquete) continue;
      counts.set(c.paquete, (counts.get(c.paquete) ?? 0) + 1);
    }
    return this._paqueteService.paquetes().map((p) => ({
      ...p,
      enUso: counts.get(p.id) ?? 0,
    }));
  });

  private readonly filtered = computed(() => {
    const q = this.filter().trim().toLowerCase();
    const all = this.enriched();
    if (!q) return all;
    return all.filter((p) => p.nombre.toLowerCase().includes(q));
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

  prevPage() { this.page.update((p) => Math.max(0, p - 1)); }
  nextPage() { this.page.update((p) => Math.min(this.totalPages() - 1, p + 1)); }

  openEditForm(row: Paquete) {
    this._dialog.open(AddEditPaqueteComponent, { data: row });
  }

  deletePaquete(row: PaqueteRow) {
    const message = row.enUso > 0
      ? `Este paquete está asignado a ${row.enUso} cliente${row.enUso === 1 ? '' : 's'}. Al eliminarlo, esos clientes quedarán sin paquete.`
      : '¿Estás seguro que deseas eliminar este paquete?';
    const ref = this._dialog.open<boolean>(DeleteComponent, {
      data: { title: 'Eliminar', name: row.nombre, message },
    });
    ref.closed.subscribe((result) => {
      if (result) {
        this._paqueteService.deletePaquete(row.id)
          .then(() => this._toast.success('Paquete eliminado', row.nombre))
          .catch((err: any) => this._toast.error('No se pudo eliminar', err?.message ?? 'Ha ocurrido un error al eliminar el paquete'));
      }
    });
  }

  private sortValue(row: PaqueteRow, col: SortColumn): string | number {
    switch (col) {
      case 'dias': return row.dias;
      case 'activo': return row.activo === false ? 0 : 1;
      case 'enUso': return row.enUso;
      default: return row.nombre.toLowerCase();
    }
  }
}
