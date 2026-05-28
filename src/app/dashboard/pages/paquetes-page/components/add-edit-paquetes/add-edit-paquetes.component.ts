import { Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { LucideDynamicIcon, LucideX } from '@lucide/angular';
import { PaqueteService } from 'src/app/dashboard/services/paquete.service';
import { ToastService } from 'src/app/shared/services/toast.service';
import { Paquete } from 'src/app/interfaces/paquete.interface';
import { UppercaseDirective } from 'src/app/shared/directives/uppercase.directive';
import { describeSupabaseError } from 'src/app/shared/errors/supabase-error';

@Component({
  selector: 'app-add-edit-paquete',
  templateUrl: './add-edit-paquetes.component.html',
  imports: [ReactiveFormsModule, DatePipe, LucideDynamicIcon, UppercaseDirective],
})
export class AddEditPaqueteComponent {
  private fb = inject(FormBuilder);
  private paqueteService = inject(PaqueteService);
  private dialogRef = inject(DialogRef<boolean>);
  private toast = inject(ToastService);
  public data = inject(DIALOG_DATA) as Paquete | undefined;

  readonly X = LucideX;
  readonly submitting = signal(false);

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

  async onFormSubmit() {
    if (this.submitting() || !this.paqueteForm.valid) return;
    const raw = this.paqueteForm.value;
    const payload: Omit<Paquete, 'id'> = {
      nombre: (raw.nombre ?? '').trim(),
      dias: Number(raw.dias),
      activo: !!raw.activo,
    };
    const editing = !!this.data?.id;
    this.submitting.set(true);
    try {
      if (editing) {
        await this.paqueteService.updatePaquete(this.data!.id, payload);
      } else {
        await this.paqueteService.addPaquete(payload);
      }
      this.toast.success(editing ? 'Paquete actualizado' : 'Paquete añadido', payload.nombre);
      this.dialogRef.close(true);
    } catch (err: any) {
      this.toast.error(editing ? 'No se pudo actualizar' : 'No se pudo añadir', describeSupabaseError(err));
      this.submitting.set(false);
    }
  }
}
