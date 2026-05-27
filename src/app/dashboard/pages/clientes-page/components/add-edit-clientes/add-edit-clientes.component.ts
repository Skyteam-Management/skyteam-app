import { Component, OnInit, inject } from '@angular/core';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { LucideDynamicIcon, LucideX } from '@lucide/angular';
import Swal from 'sweetalert2';
import { ClientService } from 'src/app/dashboard/services/client.service';
import { LiderService } from 'src/app/dashboard/services/lider.service';
import { PaqueteService } from 'src/app/dashboard/services/paquete.service';
import { Client } from 'src/app/interfaces/client.interface';

@Component({
  selector: 'app-add-edit-clientes',
  templateUrl: './add-edit-clientes.component.html',
  imports: [ReactiveFormsModule, LucideDynamicIcon],
})
export class AddEditClientComponent implements OnInit {
  private fb = inject(FormBuilder);
  private clientService = inject(ClientService);
  private liderService = inject(LiderService);
  private paqueteService = inject(PaqueteService);
  private dialogRef = inject(DialogRef<boolean>);
  public data = inject(DIALOG_DATA);

  readonly X = LucideX;
  readonly paquetes = this.paqueteService.activos;
  readonly lideres = this.liderService.lideres;
  readonly today = new Date().toISOString().split('T')[0];

  clientForm: FormGroup = this.fb.group({
    nombre: ['', Validators.required],
    telefono: ['', Validators.required],
    lider: ['', Validators.required],
    paquete: ['', Validators.required],
    fechaInicio: [this.today, Validators.required],
  });

  ngOnInit(): void {
    if (this.data?.id) {
      let fechaInicioStr = this.today;
      if (this.data.fechaInicio) {
        const d = typeof this.data.fechaInicio === 'string' ? new Date(this.data.fechaInicio) : this.data.fechaInicio;
        if (d instanceof Date && !isNaN(d.getTime())) {
          fechaInicioStr = d.toISOString().split('T')[0];
        }
      }
      this.clientForm.patchValue({
        nombre: this.data.nombre || '',
        telefono: this.data.telefono || '',
        lider: this.data.lider || '',
        paquete: this.data.paquete || '',
        fechaInicio: fechaInicioStr,
      });
    }
  }

  close() {
    this.dialogRef.close(false);
  }

  onFormSubmit() {
    if (!this.clientForm.valid) return;
    const formValue: Client = {
      ...this.clientForm.value,
      fechaInicio: this.clientForm.value.fechaInicio ? new Date(this.clientForm.value.fechaInicio) : null,
    };

    if (this.data?.id) {
      this.clientService.updateClient(this.data.id, formValue)
        .then(() => {
          Swal.fire('Éxito', `Cliente: ${formValue.nombre} actualizado correctamente`, 'success');
          this.dialogRef.close(true);
        })
        .catch((err: any) => Swal.fire('Error', err?.message ?? 'Error desconocido', 'error'));
    } else {
      this.clientService.addClient(formValue)
        .then(() => {
          Swal.fire('Éxito', `Cliente: ${formValue.nombre} añadido correctamente`, 'success');
          this.dialogRef.close(true);
        })
        .catch((err: any) => Swal.fire('Error', err?.message ?? 'Error desconocido', 'error'));
    }
  }
}
