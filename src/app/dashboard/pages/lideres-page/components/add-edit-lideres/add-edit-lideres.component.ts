import { Component, inject } from '@angular/core';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { LucideDynamicIcon, LucideX } from '@lucide/angular';
import Swal from 'sweetalert2';
import { LiderService } from 'src/app/dashboard/services/lider.service';
import { Lider } from 'src/app/interfaces/lider.interface';
import { UppercaseDirective } from 'src/app/shared/directives/uppercase.directive';

@Component({
  selector: 'app-add-edit-lider',
  templateUrl: './add-edit-lideres.component.html',
  imports: [ReactiveFormsModule, LucideDynamicIcon, UppercaseDirective],
})
export class AddEditLiderComponent {
  private fb = inject(FormBuilder);
  private liderService = inject(LiderService);
  private dialogRef = inject(DialogRef<boolean>);
  public data = inject(DIALOG_DATA);

  readonly X = LucideX;

  liderForm: FormGroup = this.fb.group({
    nombre: ['', Validators.required],
    apellido: ['', Validators.required],
  });

  constructor() {
    if (this.data?.id) {
      this.liderForm.patchValue(this.data);
    }
  }

  close() {
    this.dialogRef.close(false);
  }

  onFormSubmit() {
    if (!this.liderForm.valid) return;
    const formValue: Lider = this.liderForm.value;

    if (this.data?.id) {
      this.liderService.updateLider(this.data.id, formValue)
        .then(() => {
          Swal.fire('Éxito', `Patrocinador: ${formValue.nombre} actualizado correctamente`, 'success');
          this.dialogRef.close(true);
        })
        .catch((err: any) => Swal.fire('Error', err?.message ?? 'Error desconocido', 'error'));
    } else {
      this.liderService.addLider(formValue)
        .then(() => {
          Swal.fire('Éxito', `Patrocinador: ${formValue.nombre} añadido correctamente`, 'success');
          this.dialogRef.close(true);
        })
        .catch((err: any) => Swal.fire('Error', err?.message ?? 'Error desconocido', 'error'));
    }
  }
}
