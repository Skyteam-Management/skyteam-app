import { Component, inject } from '@angular/core';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { LucideDynamicIcon, LucideX } from '@lucide/angular';
import Swal from 'sweetalert2';
import { PaqueteService } from 'src/app/dashboard/services/paquete.service';
import { Paquete } from 'src/app/interfaces/paquete.interface';
import { UppercaseDirective } from 'src/app/shared/directives/uppercase.directive';

@Component({
  selector: 'app-add-edit-paquete',
  templateUrl: './add-edit-paquetes.component.html',
  imports: [ReactiveFormsModule, LucideDynamicIcon, UppercaseDirective],
})
export class AddEditPaqueteComponent {
  private fb = inject(FormBuilder);
  private paqueteService = inject(PaqueteService);
  private dialogRef = inject(DialogRef<boolean>);
  public data = inject(DIALOG_DATA) as Paquete | undefined;

  readonly X = LucideX;

  paqueteForm: FormGroup = this.fb.group({
    nombre: ['', Validators.required],
    dias: [30, [Validators.required, Validators.min(1)]],
    activo: [true],
  });

  constructor() {
    if (this.data?.id) {
      this.paqueteForm.patchValue({
        nombre: this.data.nombre ?? '',
        dias: this.data.dias ?? 30,
        activo: this.data.activo !== false,
      });
    }
  }

  close() {
    this.dialogRef.close(false);
  }

  onFormSubmit() {
    if (!this.paqueteForm.valid) return;
    const raw = this.paqueteForm.value;
    const payload: Omit<Paquete, 'id'> = {
      nombre: (raw.nombre ?? '').trim(),
      dias: Number(raw.dias),
      activo: !!raw.activo,
    };

    const op = this.data?.id
      ? this.paqueteService.updatePaquete(this.data.id, payload)
      : this.paqueteService.addPaquete(payload);

    op.then(() => {
        Swal.fire('Éxito', `Paquete: ${payload.nombre} ${this.data?.id ? 'actualizado' : 'añadido'} correctamente`, 'success');
        this.dialogRef.close(true);
      })
      .catch((err: any) => Swal.fire('Error', err?.message ?? 'Error desconocido', 'error'));
  }
}
