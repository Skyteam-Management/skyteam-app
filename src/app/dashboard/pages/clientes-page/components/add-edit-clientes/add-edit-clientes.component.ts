import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { LucideDynamicIcon, LucideX } from '@lucide/angular';
import { ClientService } from 'src/app/dashboard/services/client.service';
import { ToastService } from 'src/app/shared/services/toast.service';
import { PaqueteService } from 'src/app/dashboard/services/paquete.service';
import { Client } from 'src/app/interfaces/client.interface';
import { UppercaseDirective } from 'src/app/shared/directives/uppercase.directive';
import { describeSupabaseError } from 'src/app/shared/errors/supabase-error';
import { LiderComboboxComponent } from '../lider-combobox/lider-combobox.component';

@Component({
  selector: 'app-add-edit-clientes',
  templateUrl: './add-edit-clientes.component.html',
  imports: [ReactiveFormsModule, DatePipe, LucideDynamicIcon, UppercaseDirective, LiderComboboxComponent],
})
export class AddEditClientComponent implements OnInit {
  private fb = inject(FormBuilder);
  private clientService = inject(ClientService);
  private paqueteService = inject(PaqueteService);
  private dialogRef = inject(DialogRef<boolean>);
  private toast = inject(ToastService);
  public data = inject(DIALOG_DATA);

  readonly X = LucideX;
  readonly paquetes = this.paqueteService.activos;
  readonly today = new Date().toISOString().split('T')[0];
  readonly submitting = signal(false);

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

  async onFormSubmit() {
    if (this.submitting() || !this.clientForm.valid) return;
    const formValue: Client = {
      ...this.clientForm.value,
      fechaInicio: this.clientForm.value.fechaInicio ? new Date(this.clientForm.value.fechaInicio) : null,
    };
    const editing = !!this.data?.id;
    this.submitting.set(true);
    try {
      if (editing) {
        await this.clientService.updateClient(this.data.id, formValue);
        this.toast.success('Cliente actualizado', formValue.nombre);
      } else {
        await this.clientService.addClient(formValue);
        this.toast.success('Cliente añadido', formValue.nombre);
      }
      this.dialogRef.close(true);
    } catch (err: any) {
      this.toast.error(editing ? 'No se pudo actualizar' : 'No se pudo añadir', describeSupabaseError(err));
      this.submitting.set(false);
    }
  }
}
