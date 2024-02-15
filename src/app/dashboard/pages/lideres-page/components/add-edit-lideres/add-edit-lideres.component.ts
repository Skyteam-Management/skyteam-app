import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { LiderService } from 'src/app/dashboard/services/lider.service';
import { Lider } from 'src/app/interfaces/lider.interface';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-add-edit-lider',
  templateUrl: './add-edit-lideres.component.html',
  styleUrls: ['./add-edit-lideres.component.css']
})
export class AddEditLiderComponent {
  liderForm: FormGroup;
  maxDate = new Date();

  constructor(
    private fb: FormBuilder,
    private liderService: LiderService,
    private dialogRef: MatDialogRef<AddEditLiderComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) {
    this.liderForm = this.fb.group({
      nombre: ['', Validators.required],
      apellido: ['', Validators.required],
    });

    if (this.data && this.data.id) {
      this.liderForm.patchValue(this.data);
    }
  }

  onFormSubmit() {
    if (this.liderForm.valid) {
      if (this.data) {
        const updateLider: Lider = this.liderForm.value;
        this.liderService.updateLider(this.data.id, updateLider)
          .then((val: any) => {
            Swal.fire('Éxito', `Líder: ${updateLider.nombre} actualizado correctamente`, 'success');
            this.dialogRef.close(true);
          })
          .catch((err: any) => {
            Swal.fire('Error', err.error.message, 'error');
          });
      } else {
        const newLider: Lider = this.liderForm.value;
        this.liderService.addLider(newLider)
          .then((val: any) => {
            Swal.fire('Éxito', `Líder: ${newLider.nombre} añadido correctamente`, 'success');
            this.dialogRef.close(true);
          })
          .catch((err: any) => {
            Swal.fire('Error', err.error.message, 'error');
          });
      }
    }
  }
}