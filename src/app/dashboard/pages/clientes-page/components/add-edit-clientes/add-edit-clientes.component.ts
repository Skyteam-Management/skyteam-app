import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ClientService } from 'src/app/dashboard/services/client.service';
import { LiderService } from 'src/app/dashboard/services/lider.service';
import { PAQUETES } from 'src/app/dashboard/shared/constants/paquetes.constants';
import { Client } from 'src/app/interfaces/client.interface';
import { Lider } from 'src/app/interfaces/lider.interface';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-add-edit-clientes',
  templateUrl: './add-edit-clientes.component.html',
  styleUrls: ['./add-edit-clientes.component.css']
})
export class AddEditClientComponent implements OnInit {
  clientForm: FormGroup;
  maxDate = new Date();

  lideres: Lider[] = []
  
  paquetes = PAQUETES;

  constructor(
    private fb: FormBuilder,
    private clientService: ClientService,
    private liderService: LiderService,
    private dialogRef: MatDialogRef<AddEditClientComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) {
    this.clientForm = this.fb.group({
      idCliente: ['', Validators.required],
      nombre: ['', Validators.required],
      telefono: ['', Validators.required],
      lider: ['', Validators.required],
      paquete: ['', Validators.required],
      fechaInicio: [new Date(), Validators.required] // Initialize with current date
    });

    if (this.data && this.data.idCliente) {
      // Convert the fechaInicio string to a Date object
      if (this.data.fechaInicio && typeof this.data.fechaInicio === 'string') {
        this.data.fechaInicio = new Date(this.data.fechaInicio);
      }
      this.clientForm.patchValue(this.data);
    }
  }

  ngOnInit(): void {
    this.liderService.getLideres().subscribe(lideres => {
      this.lideres = lideres;
    })
  }

  onFormSubmit() {
    if (this.clientForm.valid) {
      if (this.data) {
        const updateClient: Client = this.clientForm.value;
        this.clientService.updateClient(this.data.id, updateClient)
          .then((val: any) => {
            Swal.fire('Éxito', `Cliente: ${updateClient.nombre} actualizado correctamente`, 'success');
            this.dialogRef.close(true);
          })
          .catch((err: any) => {
            Swal.fire('Error', err.error.message, 'error');
          });
      } else {
        const newClient: Client = this.clientForm.value;
        this.clientService.addClient(newClient)
          .then((val: any) => {
            Swal.fire('Éxito', `Cliente: ${newClient.nombre} añadido correctamente`, 'success');
            this.dialogRef.close(true);
          })
          .catch((err: any) => {
            Swal.fire('Error', err.error.message, 'error');
          });
      }
    }
  }


}
