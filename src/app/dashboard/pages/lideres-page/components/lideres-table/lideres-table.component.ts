import { Component, computed, inject, signal } from '@angular/core';
import { Dialog } from '@angular/cdk/dialog';
import { LucideDynamicIcon, LucideArrowUpDown, LucideArrowUp, LucideArrowDown, LucidePencil, LucideTrash2, LucideSearch, LucideChevronLeft, LucideChevronRight } from '@lucide/angular';
import Swal from 'sweetalert2';
import { LiderService } from 'src/app/dashboard/services/lider.service';
import { DeleteComponent } from 'src/app/dashboard/components/delete/delete.component';
import { Lider } from 'src/app/interfaces/lider.interface';
import { AddEditLiderComponent } from '../add-edit-lideres/add-edit-lideres.component';

type SortColumn = 'nombre' | 'apellido';
type SortDir = 'asc' | 'desc';

@Component({
  selector: 'app-lideres-table',
  templateUrl: './lideres-table.component.html',
  imports: [LucideDynamicIcon],
})
export class LideresTableComponent {
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

  private readonly filtered = computed(() => {
    const q = this.filter().trim().toLowerCase();
    const all = this._liderService.lideres();
    if (!q) return all;
    return all.filter((l) => `${l.nombre ?? ''} ${l.apellido ?? ''}`.toLowerCase().includes(q));
  });

  private readonly sorted = computed(() => {
    const col = this.sortColumn();
    const dir = this.sortDir() === 'asc' ? 1 : -1;
    if (!col) return this.filtered();
    return [...this.filtered()].sort((a, b) => {
      const av = (a[col] ?? '').toString().toLowerCase();
      const bv = (b[col] ?? '').toString().toLowerCase();
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

  openEditForm(row: Lider) {
    this._dialog.open(AddEditLiderComponent, { data: row });
  }

  deleteLider(row: Lider) {
    const ref = this._dialog.open<boolean>(DeleteComponent, {
      data: { title: 'Eliminar', name: row.nombre, message: '¿Estás seguro que deseas eliminar este patrocinador?' },
    });
    ref.closed.subscribe((result) => {
      if (result) {
        this._liderService.deleteLider(row.id!).catch(() => {
          Swal.fire('Error', 'Ha ocurrido un error al eliminar el patrocinador', 'error');
        });
      }
    });
  }
}
