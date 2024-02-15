import { Injectable, NgZone, computed, signal } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore, AngularFirestoreDocument } from '@angular/fire/compat/firestore';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { FirebaseCodeErrorService } from './firebase-code-error.service';
import { AuthStatus, User } from '../interfaces';
import { Observable, of, switchMap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  user$: Observable<any>;

  constructor(
    private fireAuth: AngularFireAuth,
    private afs: AngularFirestore,
    private router: Router,
    private ngZone: NgZone,
    private _firebaseError: FirebaseCodeErrorService
  ) {
    this.user$ = this.fireAuth.authState.pipe(
      switchMap(user => {
        if (user) {
          return of(user);
        } else {
          return of(null);
        }
      })
    );
  }

  async logInWithEmail(email: string, password: string) {
    try {
      const userCredential = await this.fireAuth.signInWithEmailAndPassword(email, password);
      this.router.navigate(['dashboard']);
      return userCredential;
    } catch (error: any) {
      Swal.fire({
        icon: 'error',
        text: this._firebaseError.codeError(error.code),
        heightAuto: false,
        customClass: {
          confirmButton: 'confirm-button-class',
          popup: 'bg-negro',
          validationMessage: 'texto-blanco'
        }
      });
    }
    return null; 
  }

  async logOut() {
    await this.fireAuth.signOut();
    this.router.navigate(['login']);
  }
}
