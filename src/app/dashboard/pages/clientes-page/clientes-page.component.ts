import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { Client } from 'src/app/interfaces/client.interface';
import { ClientService } from '../../services/client.service';
import { DatePipe } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { AddEditClientComponent } from './components/add-edit-clientes/add-edit-clientes.component';

@Component({
  selector: 'app-clientes-page',
  templateUrl: './clientes-page.component.html',
  styleUrls: ['./clientes-page.component.css'],
  providers: [DatePipe]
})
export class ClientesPageComponent {

  displayedColumns: string[] = ['idCliente', 'nombre', 'apellido', 'telefono', 'lider', 'fechaInicio', 'estado', 'editar'];

  clientData: Client[] = [];

  private dialog = inject(MatDialog)

  constructor(
    private _clientService: ClientService,
    private datePipe: DatePipe,
    private cdr: ChangeDetectorRef  // Inject ChangeDetectorRef
  ) {
    this.loadClientData();
  }

  loadClientData() {
    this._clientService.getClients().subscribe(clients => {
      this.clientData = clients.map(client => ({
        ...client,
        fechaInicio: client.fechaInicio ? this.timestampToDate(client.fechaInicio) : null
      }));
      // Trigger change detection after updating clientData
      this.cdr.detectChanges();
      if (this.clientData.length > 0) {
        console.log('Hay datos de clientes:', this.clientData);
      } else {
        console.log('No hay datos de clientes');
      }
    });
  }

  timestampToDate(timestamp: any): string | null {
    if (timestamp && timestamp.seconds) {
      const date = new Date(timestamp.seconds * 1000);
      return this.datePipe.transform(date, 'MMM d, y') || null;
    }
    return null;
  }

  openAddForm() {
    const dialogRef = this.dialog.open(AddEditClientComponent, {
      panelClass: 'custom-dialog-container'
    });
    dialogRef.afterClosed().subscribe({
      next: (val) => {
        if (val) {
          this.loadClientData();
        }
      }
    });  
  }
}
