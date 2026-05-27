import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { User } from '@supabase/supabase-js';
import { BehaviorSubject, Observable, filter } from 'rxjs';
import Swal from 'sweetalert2';
import { SupabaseService } from '../../services/supabase.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private _user$ = new BehaviorSubject<User | null | undefined>(undefined);
  user$: Observable<User | null> = this._user$.asObservable().pipe(
    filter((v): v is User | null => v !== undefined),
  );

  constructor(
    private supabase: SupabaseService,
    private router: Router,
  ) {
    this.supabase.client.auth.onAuthStateChange((_event, session) => {
      this._user$.next(session?.user ?? null);
    });
  }

  async logInWithEmail(email: string, password: string) {
    const { data, error } = await this.supabase.client.auth.signInWithPassword({ email, password });
    if (error) {
      Swal.fire({
        icon: 'error',
        text: this.translateError(error.message),
        heightAuto: false,
        customClass: {
          confirmButton: 'confirm-button-class',
          popup: 'bg-negro',
          validationMessage: 'texto-blanco',
        },
      });
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
