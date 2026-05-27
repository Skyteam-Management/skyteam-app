import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { LucideDynamicIcon, LucideClock, LucideRefreshCw, LucideUser, LucidePlus, LucidePencil, LucideTrash2 } from '@lucide/angular';
import { HistorialService } from 'src/app/dashboard/services/historial.service';
import { Historial, HistorialAccion, HistorialTabla } from 'src/app/interfaces/historial.interface';

type TablaFilter = HistorialTabla | 'all';
type AccionFilter = HistorialAccion | 'all';

@Component({
  selector: 'app-historial-page',
  templateUrl: './historial-page.component.html',
  imports: [DatePipe, LucideDynamicIcon],
})
export class HistorialPageComponent {
  private historial = inject(HistorialService);

  readonly Clock = LucideClock;
  readonly Refresh = LucideRefreshCw;
  readonly User = LucideUser;
  readonly Plus = LucidePlus;
  readonly Pencil = LucidePencil;
  readonly Trash = LucideTrash2;

  readonly entries = this.historial.entries;
  readonly loading = this.historial.loading;

  readonly tablaFilter = signal<TablaFilter>('all');
  readonly accionFilter = signal<AccionFilter>('all');

  readonly tablaOptions: { value: TablaFilter; label: string }[] = [
    { value: 'all',       label: 'Todas' },
    { value: 'clientes',  label: 'Clientes' },
    { value: 'lideres',   label: 'Patrocinadores' },
    { value: 'paquetes',  label: 'Paquetes' },
  ];

  readonly accionOptions: { value: AccionFilter; label: string }[] = [
    { value: 'all',    label: 'Todas' },
    { value: 'insert', label: 'Creación' },
    { value: 'update', label: 'Edición' },
    { value: 'delete', label: 'Eliminación' },
  ];

  readonly filtered = computed(() => {
    const t = this.tablaFilter();
    const a = this.accionFilter();
    return this.entries().filter((e) =>
      (t === 'all' || e.tabla === t) &&
      (a === 'all' || e.accion === a)
    );
  });

  constructor() {
    this.historial.refresh();
  }

  setTabla(event: Event) { this.tablaFilter.set((event.target as HTMLSelectElement).value as TablaFilter); }
  setAccion(event: Event) { this.accionFilter.set((event.target as HTMLSelectElement).value as AccionFilter); }
  refresh() { this.historial.refresh(); }

  iconFor(accion: HistorialAccion) {
    return accion === 'insert' ? this.Plus
         : accion === 'update' ? this.Pencil
         : this.Trash;
  }

  accionBadgeClasses(accion: HistorialAccion): string {
    return accion === 'insert' ? 'bg-(--color-gold)/15 text-(--color-gold)'
         : accion === 'update' ? 'bg-(--color-muted)/40 text-(--color-foreground)'
         : 'bg-(--color-destructive)/15 text-(--color-destructive)';
  }

  accionLabel(accion: HistorialAccion): string {
    return accion === 'insert' ? 'Creó'
         : accion === 'update' ? 'Editó'
         : 'Eliminó';
  }

  tablaLabel(tabla: HistorialTabla): string {
    return tabla === 'clientes' ? 'Cliente'
         : tabla === 'lideres'  ? 'Patrocinador'
         : 'Paquete';
  }

  describeEntry(entry: Historial): string {
    const datos = entry.datos as Record<string, any> | null;
    if (!datos) return entry.registroId;
    if (entry.tabla === 'lideres')  return `${datos['nombre'] ?? ''} ${datos['apellido'] ?? ''}`.trim() || entry.registroId;
    if (entry.tabla === 'paquetes') return datos['nombre'] ?? entry.registroId;
    if (entry.tabla === 'clientes') return datos['nombre'] ?? entry.registroId;
    return entry.registroId;
  }
}
