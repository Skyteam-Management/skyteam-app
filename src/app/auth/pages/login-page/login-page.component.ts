import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { MatFormField, MatLabel, MatSuffix } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatIcon } from '@angular/material/icon';
import { MatIconButton, MatButton } from '@angular/material/button';

@Component({
    selector: 'app-login-page',
    templateUrl: './login-page.component.html',
    styleUrls: ['./login-page.component.css'],
    imports: [ReactiveFormsModule, MatFormField, MatLabel, MatInput, MatIcon, MatSuffix, MatIconButton, MatButton, RouterLink]
})
export class LoginPageComponent {
  hide = true;

  public loginForm: FormGroup = new FormGroup({});

  constructor(
    private _fb: FormBuilder,
    private _authService: AuthService,
    private router: Router,
  ) {
    this.loginForm = this._fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]]
    });
  }

  logIn() {
    const email = this.loginForm.get('email')?.value;
    const password = this.loginForm.get('password')?.value;
    this._authService.logInWithEmail(email, password)
  }


}
