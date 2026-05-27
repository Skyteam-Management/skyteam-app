import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LucideDynamicIcon, LucideArrowLeft, LucideSearch } from '@lucide/angular';
import { ClientService } from 'src/app/dashboard/services/client.service';
import { LiderService } from 'src/app/dashboard/services/lider.service';
import { Lider } from 'src/app/interfaces/lider.interface';

@Component({
  selector: 'app-table-page',
  templateUrl: './table-page.component.html',
  imports: [DatePipe, RouterLink, LucideDynamicIcon],
})
export class TablePageComponent {
  private _clientService = inject(ClientService);
  private _liderService = inject(LiderService);

  readonly ArrowLeft = LucideArrowLeft;
  readonly Search = LucideSearch;
  readonly filter = signal('');

  readonly enriched = computed(() => {
    const liderById = new Map(this._liderService.lideres().map((l) => [l.id, l] as const));
    return this._clientService.clients().map((c) => ({
      ...c,
      liderNombre: this.formatLider(liderById.get(c.lider)),
      expirado: this.isExpired(c.fechaInicio),
    }));
  });

  readonly filtered = computed(() => {
    const q = this.filter().trim().toLowerCase();
    const all = this.enriched();
    if (!q) return all;
    return all.filter((row) => `${row.nombre} ${row.liderNombre}`.toLowerCase().includes(q));
  });

  onFilterChange(event: Event) {
    this.filter.set((event.target as HTMLInputElement).value);
  }

  private isExpired(fechaInicio: string | Date | null): boolean {
    if (!fechaInicio) return false;
    const d = typeof fechaInicio === 'string' ? new Date(fechaInicio) : fechaInicio;
    if (!(d instanceof Date) || isNaN(d.getTime())) return false;
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    return d < oneMonthAgo;
  }

  private formatLider(lider: Lider | undefined): string {
    return lider ? `${lider.nombre} ${lider.apellido}` : '—';
  }
}
