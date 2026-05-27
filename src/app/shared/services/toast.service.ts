import { Injectable, signal } from '@angular/core';

export type ToastKind = 'success' | 'error' | 'info';

export interface Toast {
  id: number;
  kind: ToastKind;
  title: string;
  description?: string;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly _toasts = signal<Toast[]>([]);
  readonly toasts = this._toasts.asReadonly();

  private nextId = 0;
  private readonly defaultDuration: Record<ToastKind, number> = {
    success: 3500,
    info: 4000,
    error: 6000,
  };

  success(title: string, description?: string) { this.push('success', title, description); }
  error(title: string, description?: string)   { this.push('error', title, description); }
  info(title: string, description?: string)    { this.push('info', title, description); }

  dismiss(id: number) {
    this._toasts.update((list) => list.filter((t) => t.id !== id));
  }

  private push(kind: ToastKind, title: string, description?: string) {
    const id = ++this.nextId;
    this._toasts.update((list) => [...list, { id, kind, title, description }]);
    setTimeout(() => this.dismiss(id), this.defaultDuration[kind]);
  }
}
