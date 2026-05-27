import { Component, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { LucideDynamicIcon, LucideEye, LucideEyeOff, LucideMail } from '@lucide/angular';
import { AuthService } from '../../services/auth.service';

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

  loginForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  togglePassword() {
    this.hide.update((v) => !v);
  }

  logIn() {
    if (!this.loginForm.valid) return;
    const { email, password } = this.loginForm.value;
    this.authService.logInWithEmail(email, password);
  }
}
