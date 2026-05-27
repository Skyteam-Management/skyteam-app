import { Component, effect, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { MatButton } from '@angular/material/button';
import { Client } from 'src/app/interfaces/client.interface';
import { ClientService } from '../../services/client.service';
import { AddEditClientComponent } from './components/add-edit-clientes/add-edit-clientes.component';
import { ClientesTableComponent } from './components/clientes-table/clientes-table.component';

@Component({
  selector: 'app-clientes-page',
  templateUrl: './clientes-page.component.html',
  styleUrls: ['./clientes-page.component.css'],
  providers: [DatePipe],
  imports: [MatButton, ClientesTableComponent],
})
export class ClientesPageComponent {
  displayedColumns: string[] = ['idCliente', 'nombre', 'apellido', 'telefono', 'lider', 'fechaInicio', 'estado', 'editar'];

  private clientService = inject(ClientService);
  private datePipe = inject(DatePipe);
  private dialog = inject(MatDialog);

  readonly clientData = signal<Client[]>([]);

  constructor() {
    effect(() => {
      const clients = this.clientService.clients();
      this.clientData.set(
        clients.map((client) => ({
          ...client,
          fechaInicio: client.fechaInicio ? this.timestampToDate(client.fechaInicio) : null,
        })),
      );
    });
  }

  private timestampToDate(timestamp: any): string | null {
    if (timestamp && timestamp.seconds) {
      const date = new Date(timestamp.seconds * 1000);
      return this.datePipe.transform(date, 'MMM d, y') || null;
    }
    return null;
  }

  openAddForm() {
    this.dialog.open(AddEditClientComponent, {
      panelClass: 'custom-dialog-container',
    });
  }
}
