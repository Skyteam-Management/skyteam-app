import { Injectable } from '@angular/core';
import { FirebaseErrorEnum } from '../utils/firebase-code-error';

@Injectable({
  providedIn: 'root'
})
export class FirebaseCodeErrorService {

  constructor() { }

  codeError(code: string) {
    switch (code) {
      case FirebaseErrorEnum.INVALID_EMAIL:
        return 'Email inválido';
      case FirebaseErrorEnum.USER_DISABLED:
        return 'Usuario deshabilitado';
      case FirebaseErrorEnum.USER_NOT_FOUND:
        return 'Usuario no encontrado';
      case FirebaseErrorEnum.WRONG_PASSWORD:
        return 'Contraseña incorrecta';
      default:
        return 'Error desconocido';
    }
  }
}
