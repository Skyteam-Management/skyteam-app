import { Component, Inject, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogTitle, MatDialogClose } from '@angular/material/dialog';
import { MatFormField, MatLabel, MatSuffix } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatSelect, MatOption } from '@angular/material/select';
import { MatDatepickerInput, MatDatepickerToggle, MatDatepicker } from '@angular/material/datepicker';
import Swal from 'sweetalert2';
import { ClientService } from 'src/app/dashboard/services/client.service';
import { LiderService } from 'src/app/dashboard/services/lider.service';
import { PAQUETES } from 'src/app/dashboard/shared/constants/paquetes.constants';
import { Client } from 'src/app/interfaces/client.interface';

@Component({
  selector: 'app-add-edit-clientes',
  templateUrl: './add-edit-clientes.component.html',
  styleUrls: ['./add-edit-clientes.component.css'],
  imports: [
    MatDialogTitle,
    ReactiveFormsModule,
    MatFormField,
    MatLabel,
    MatInput,
    MatSelect,
    MatOption,
    MatDatepickerInput,
    MatDatepickerToggle,
    MatSuffix,
    MatDatepicker,
    MatDialogClose,
  ],
})
export class AddEditClientComponent implements OnInit {
  private fb = inject(FormBuilder);
  private clientService = inject(ClientService);
  private liderService = inject(LiderService);
  private dialogRef = inject<MatDialogRef<AddEditClientComponent>>(MatDialogRef);
  public data = inject(MAT_DIALOG_DATA);

  clientForm: FormGroup;
  maxDate = new Date();
  paquetes = PAQUETES;

  readonly lideres = this.liderService.lideres;

  constructor() {
    this.clientForm = this.fb.group({
      nombre: ['', Validators.required],
      telefono: ['', Validators.required],
      lider: ['', Validators.required],
      paquete: ['', Validators.required],
      fechaInicio: [new Date(), Validators.required],
    });
  }

  ngOnInit(): void {
    if (this.data && this.data.id) {
      let fechaInicioDate = new Date();
      if (this.data.fechaInicio) {
        fechaInicioDate = typeof this.data.fechaInicio === 'string' ? new Date(this.data.fechaInicio) : this.data.fechaInicio;
      }
      this.clientForm.patchValue({
        nombre: this.data.nombre || '',
        telefono: this.data.telefono || '',
        lider: this.data.lider || '',
        paquete: this.data.paquete || '',
        fechaInicio: fechaInicioDate,
      });
    }
  }

  onFormSubmit() {
    if (!this.clientForm.valid) return;
    const formValue: Client = this.clientForm.value;

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
