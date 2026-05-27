import { Directive, HostListener } from '@angular/core';
import { NgControl } from '@angular/forms';

@Directive({
  selector: '[appUppercase]',
  standalone: true,
})
export class UppercaseDirective {
  constructor(private control: NgControl) {}

  @HostListener('input', ['$event'])
  onInput(event: Event) {
    const input = event.target as HTMLInputElement;
    const upper = input.value.toLocaleUpperCase('es');
    if (input.value === upper) return;

    const start = input.selectionStart;
    const end = input.selectionEnd;
    input.value = upper;
    this.control.control?.setValue(upper, { emitEvent: false });
    if (start !== null && end !== null) {
      input.setSelectionRange(start, end);
    }
  }
}
