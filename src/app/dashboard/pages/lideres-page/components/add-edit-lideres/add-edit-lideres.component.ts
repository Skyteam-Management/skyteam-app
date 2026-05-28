import { Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { LucideDynamicIcon, LucideX } from '@lucide/angular';
import { LiderService } from 'src/app/dashboard/services/lider.service';
import { ToastService } from 'src/app/shared/services/toast.service';
import { Lider } from 'src/app/interfaces/lider.interface';
import { UppercaseDirective } from 'src/app/shared/directives/uppercase.directive';
import { describeSupabaseError } from 'src/app/shared/errors/supabase-error';
import { collectFormIssues, FieldLabels, summarizeFormIssues } from 'src/app/shared/forms/form-validation';

@Component({
  selector: 'app-add-edit-lider',
  templateUrl: './add-edit-lideres.component.html',
  imports: [ReactiveFormsModule, DatePipe, LucideDynamicIcon, UppercaseDirective],
})
export class AddEditLiderComponent {
  private fb = inject(FormBuilder);
  private liderService = inject(LiderService);
  private dialogRef = inject(DialogRef<boolean>);
  private toast = inject(ToastService);
  public data = inject(DIALOG_DATA);

  readonly X = LucideX;
  readonly submitting = signal(false);

  liderForm: FormGroup = this.fb.group({
    nombre: ['', Validators.required],
    apellido: ['', Validators.required],
  });

  private readonly fieldLabels: FieldLabels = {
    nombre: 'Nombre',
    apellido: 'Apellido',
  };

  constructor() {
    if (this.data?.id) {
      this.liderForm.patchValue(this.data);
    }
  }

  close() {
    this.dialogRef.close(false);
  }

  async onFormSubmit() {
    if (this.submitting()) return;
    if (!this.liderForm.valid) {
      this.liderForm.markAllAsTouched();
      const { title, description } = summarizeFormIssues(collectFormIssues(this.liderForm, this.fieldLabels));
      this.toast.error(title, description);
      return;
    }
    const formValue: Lider = this.liderForm.value;
    const editing = !!this.data?.id;
    this.submitting.set(true);
    try {
      if (editing) {
        await this.liderService.updateLider(this.data.id, formValue);
        this.toast.success('Patrocinador actualizado', `${formValue.nombre} ${formValue.apellido}`);
      } else {
        await this.liderService.addLider(formValue);
        this.toast.success('Patrocinador añadido', `${formValue.nombre} ${formValue.apellido}`);
      }
      this.dialogRef.close(true);
    } catch (err: any) {
      this.toast.error(editing ? 'No se pudo actualizar' : 'No se pudo añadir', describeSupabaseError(err));
      this.submitting.set(false);
    }
  }
}
