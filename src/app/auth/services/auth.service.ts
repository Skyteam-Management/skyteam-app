import { Injectable, computed, inject, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { User } from '@supabase/supabase-js';
import { filter } from 'rxjs';
import { SupabaseService } from '../../services/supabase.service';
import { ToastService } from 'src/app/shared/services/toast.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private supabase = inject(SupabaseService);
  private router = inject(Router);
  private toast = inject(ToastService);

  private readonly _user = signal<User | null | undefined>(undefined);
  readonly user = computed(() => this._user() ?? null);
  readonly isLoggedIn = computed(() => this._user() != null);

  readonly user$ = toObservable(this._user).pipe(
    filter((v): v is User | null => v !== undefined),
  );

  constructor() {
    this.supabase.client.auth.onAuthStateChange((_event, session) => {
      this._user.set(session?.user ?? null);
    });
  }

  async logInWithEmail(email: string, password: string) {
    const { data, error } = await this.supabase.client.auth.signInWithPassword({ email, password });
    if (error) {
      this.toast.error('No se pudo iniciar sesión', this.translateError(error.message));
      return null;
    }
    this.router.navigate(['dashboard']);
    return data;
  }

  async logOut() {
    await this.supabase.client.auth.signOut();
    this.router.navigate(['/auth/login']);
  }

  private translateError(message: string): string {
    const m = message.toLowerCase();
    if (m.includes('invalid login credentials')) return 'Email o contraseña incorrectos';
    if (m.includes('email not confirmed')) return 'Email no confirmado';
    if (m.includes('user not found')) return 'Usuario no encontrado';
    if (m.includes('too many requests')) return 'Demasiados intentos, espera un momento';
    return message;
  }
}
