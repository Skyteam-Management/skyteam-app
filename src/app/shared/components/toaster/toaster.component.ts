import { Component, inject } from '@angular/core';
import { LucideDynamicIcon, LucideCheck, LucideTriangleAlert, LucideInfo, LucideX } from '@lucide/angular';
import { ToastKind, ToastService } from 'src/app/shared/services/toast.service';

@Component({
  selector: 'app-toaster',
  templateUrl: './toaster.component.html',
  imports: [LucideDynamicIcon],
})
export class ToasterComponent {
  private toast = inject(ToastService);
  readonly toasts = this.toast.toasts;

  readonly Check = LucideCheck;
  readonly Alert = LucideTriangleAlert;
  readonly Info = LucideInfo;
  readonly X = LucideX;

  iconFor(kind: ToastKind) {
    return kind === 'success' ? this.Check
         : kind === 'error'   ? this.Alert
         : this.Info;
  }

  eyebrowFor(kind: ToastKind) {
    return kind === 'success' ? 'Éxito'
         : kind === 'error'   ? 'Error'
         : 'Aviso';
  }

  iconWrapClasses(kind: ToastKind): string {
    return kind === 'success' ? 'bg-(--color-gold)/15 text-(--color-gold)'
         : kind === 'error'   ? 'bg-(--color-destructive)/15 text-(--color-destructive)'
         : 'bg-(--color-muted)/40 text-(--color-muted-foreground)';
  }

  accentClasses(kind: ToastKind): string {
    return kind === 'success' ? 'bg-(--color-gold)'
         : kind === 'error'   ? 'bg-(--color-destructive)'
         : 'bg-(--color-muted-foreground)';
  }

  dismiss(id: number) { this.toast.dismiss(id); }
}
