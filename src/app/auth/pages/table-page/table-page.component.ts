import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LucideDynamicIcon, LucideArrowLeft, LucideSearch } from '@lucide/angular';
import { ClientService } from 'src/app/dashboard/services/client.service';

@Component({
  selector: 'app-table-page',
  templateUrl: './table-page.component.html',
  imports: [DatePipe, RouterLink, LucideDynamicIcon],
})
export class TablePageComponent {
  private _clientService = inject(ClientService);

  readonly ArrowLeft = LucideArrowLeft;
  readonly Search = LucideSearch;
  readonly filter = signal('');

  readonly filtered = computed(() => {
    const q = this.filter().trim().toLowerCase();
    const all = this._clientService.clients();
    if (!q) return all;
    return all.filter((row) => `${row.nombre} ${row.liderNombre ?? ''}`.toLowerCase().includes(q));
  });

  onFilterChange(event: Event) {
    this.filter.set((event.target as HTMLInputElement).value);
  }
}
