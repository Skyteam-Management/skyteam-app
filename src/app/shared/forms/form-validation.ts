import { AbstractControl, FormGroup, ValidationErrors } from '@angular/forms';

export interface FormIssue {
  field: string;
  label: string;
  message: string;
}

export interface FormIssueSummary {
  title: string;
  description: string;
}

export type FieldLabels<T extends string = string> = Record<T, string>;

export function collectFormIssues(form: FormGroup, labels: FieldLabels): FormIssue[] {
  const issues: FormIssue[] = [];
  for (const [name, ctrl] of Object.entries(form.controls)) {
    if (!ctrl || ctrl.valid || ctrl.disabled) continue;
    const label = labels[name] ?? name;
    issues.push({ field: name, label, message: messageFor(ctrl, label) });
  }
  return issues;
}

export function summarizeFormIssues(issues: FormIssue[]): FormIssueSummary {
  if (issues.length === 0) {
    return { title: 'Revisa el formulario', description: 'Hay datos sin completar.' };
  }
  if (issues.length === 1) {
    return { title: 'Falta completar un campo', description: issues[0].message };
  }
  return {
    title: `Faltan ${issues.length} campos por completar`,
    description: issues.map((i) => `• ${i.message}`).join('\n'),
  };
}

function messageFor(ctrl: AbstractControl, label: string): string {
  const errors: ValidationErrors | null = ctrl.errors;
  if (!errors) return `Revisa el campo «${label}»`;

  if (errors['required']) return `«${label}» es obligatorio`;
  if (errors['email']) return `«${label}» no tiene un formato de correo válido`;

  const minLength = errors['minlength'] as { requiredLength: number } | undefined;
  if (minLength) return `«${label}» debe tener al menos ${minLength.requiredLength} caracteres`;

  const maxLength = errors['maxlength'] as { requiredLength: number } | undefined;
  if (maxLength) return `«${label}» no puede tener más de ${maxLength.requiredLength} caracteres`;

  const min = errors['min'] as { min: number } | undefined;
  if (min) return `«${label}» debe ser mayor o igual a ${min.min}`;

  const max = errors['max'] as { max: number } | undefined;
  if (max) return `«${label}» debe ser menor o igual a ${max.max}`;

  if (errors['pattern']) return `«${label}» no tiene un formato válido`;

  return `Revisa el campo «${label}»`;
}
