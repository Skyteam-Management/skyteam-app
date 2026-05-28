import { Component, inject } from '@angular/core';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { LucideDynamicIcon, LucideTriangleAlert } from '@lucide/angular';

interface DeleteData {
  title?: string;
  name?: string;
  message?: string;
}

@Component({
  selector: 'app-delete',
  templateUrl: './delete.component.html',
  imports: [LucideDynamicIcon],
})
export class DeleteComponent {
  readonly TriangleAlert = LucideTriangleAlert;

  readonly data = inject<DeleteData>(DIALOG_DATA);
  private dialogRef = inject(DialogRef<boolean>);

  close() {
    this.dialogRef.close(false);
  }

  delete() {
    this.dialogRef.close(true);
  }
}
