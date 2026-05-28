import { Component, ElementRef, inject, signal, viewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { LucideDynamicIcon, LucideEye, LucideEyeOff, LucideMail } from '@lucide/angular';
import { AuthService } from '../../services/auth.service';

const REMEMBERED_EMAIL_KEY = 'avm:remembered_email';

@Component({
  selector: 'app-login-page',
  templateUrl: './login-page.component.html',
  imports: [ReactiveFormsModule, LucideDynamicIcon],
})
export class LoginPageComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);

  readonly Eye = LucideEye;
  readonly EyeOff = LucideEyeOff;
  readonly Mail = LucideMail;

  hide = signal(true);
  submitting = signal(false);
  remember = signal(false);

  emailInput = viewChild<ElementRef<HTMLInputElement>>('emailInput');
  passwordInput = viewChild<ElementRef<HTMLInputElement>>('passwordInput');

  loginForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  constructor() {
    const stored = this.readRememberedEmail();
    if (stored) {
      this.loginForm.patchValue({ email: stored });
      this.remember.set(true);
    }
  }

  togglePassword() {
    this.hide.update((v) => !v);
  }

  toggleRemember() {
    this.remember.update((v) => !v);
  }

  async logIn() {
    if (this.submitting()) return;

    // Some browsers don't fire `input` events for autofilled credentials, so
    // the FormControls stay empty even though the DOM has values. Sync from
    // the DOM as a fallback before validating.
    const emailEl = this.emailInput()?.nativeElement;
    const passwordEl = this.passwordInput()?.nativeElement;
    if (emailEl && passwordEl) {
      this.loginForm.patchValue(
        { email: emailEl.value, password: passwordEl.value },
        { emitEvent: false }
      );
    }

    if (!this.loginForm.valid) return;
    this.submitting.set(true);
    try {
      const { email, password } = this.loginForm.value;
      const result = await this.authService.logInWithEmail(email, password);
      if (result) this.persistRememberedEmail(email);
    } finally {
      this.submitting.set(false);
    }
  }

  private persistRememberedEmail(email: string) {
    try {
      if (this.remember()) {
        localStorage.setItem(REMEMBERED_EMAIL_KEY, email);
      } else {
        localStorage.removeItem(REMEMBERED_EMAIL_KEY);
      }
    } catch {
      // localStorage may be unavailable (private mode, quota). Ignore — non-critical.
    }
  }

  private readRememberedEmail(): string | null {
    try {
      return localStorage.getItem(REMEMBERED_EMAIL_KEY);
    } catch {
      return null;
    }
  }
}
