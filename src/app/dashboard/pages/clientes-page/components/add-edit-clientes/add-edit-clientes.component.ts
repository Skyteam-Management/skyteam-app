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
      nombre: ['', Validators.required],
      telefono: ['', Validators.required],
      lider: ['', Validators.required],
      paquete: ['', Validators.required],
      fechaInicio: [new Date(), Validators.required] // Initialize with current date
    });

    // Debug: Log the received data
    console.log('Data received in dialog:', this.data);
  }

  ngOnInit(): void {
    this.liderService.getLideres().subscribe(lideres => {
      this.lideres = lideres;
      
      // Initialize form with data after lideres are loaded
      if (this.data && this.data.id) {
        console.log('Editing client with data:', this.data);
        
        // Convert the fechaInicio string to a Date object
        let fechaInicioDate = new Date();
        if (this.data.fechaInicio) {
          if (typeof this.data.fechaInicio === 'string') {
            fechaInicioDate = new Date(this.data.fechaInicio);
          } else {
            fechaInicioDate = this.data.fechaInicio;
          }
        }
        
        // Prepare the data for the form
        const formData = {
          nombre: this.data.nombre || '',
          telefono: this.data.telefono || '',
          lider: this.data.lider || '',
          paquete: this.data.paquete || '',
          fechaInicio: fechaInicioDate
        };
        
        console.log('Form data to patch:', formData);
        this.clientForm.patchValue(formData);
      }
    });
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
            Swal.fire('Error', err?.message ?? 'Error desconocido', 'error');
          });
      } else {
        const newClient: Client = this.clientForm.value;
        this.clientService.addClient(newClient)
          .then((val: any) => {
            Swal.fire('Éxito', `Cliente: ${newClient.nombre} añadido correctamente`, 'success');
            this.dialogRef.close(true);
          })
          .catch((err: any) => {
            Swal.fire('Error', err?.message ?? 'Error desconocido', 'error');
          });
      }
    }
  }


}
