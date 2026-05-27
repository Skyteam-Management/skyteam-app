import { Component, computed, forwardRef, inject, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { LucideDynamicIcon, LucideChevronDown } from '@lucide/angular';
import { LiderService } from 'src/app/dashboard/services/lider.service';
import { Lider } from 'src/app/interfaces/lider.interface';
import { UppercaseDirective } from 'src/app/shared/directives/uppercase.directive';

@Component({
  selector: 'app-lider-combobox',
  templateUrl: './lider-combobox.component.html',
  imports: [LucideDynamicIcon, UppercaseDirective],
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => LiderComboboxComponent),
    multi: true,
  }],
})
export class LiderComboboxComponent implements ControlValueAccessor {
  private liderService = inject(LiderService);

  readonly ChevronDown = LucideChevronDown;
  readonly lideres = this.liderService.lideres;

  readonly query = signal('');
  readonly open = signal(false);
  readonly highlight = signal(0);
  readonly value = signal('');
  readonly disabled = signal(false);

  private onChange: (v: string) => void = () => {};
  private onTouched: () => void = () => {};
  private blurTimer: ReturnType<typeof setTimeout> | null = null;

  readonly displayName = computed(() => {
    const id = this.value();
    if (!id) return '';
    const l = this.lideres().find((x) => x.id === id);
    return l ? `${l.nombre} ${l.apellido}` : '';
  });

  readonly filtered = computed(() => {
    const q = this.query().trim().toLowerCase();
    const all = this.lideres();
    if (!q) return all;
    return all.filter((l) => `${l.nombre} ${l.apellido}`.toLowerCase().includes(q));
  });

  writeValue(id: string | null): void {
    this.value.set(id ?? '');
    this.query.set(this.displayName());
  }
  registerOnChange(fn: (v: string) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }
  setDisabledState(isDisabled: boolean): void { this.disabled.set(isDisabled); }

  onFocus() {
    if (this.disabled()) return;
    if (this.blurTimer) { clearTimeout(this.blurTimer); this.blurTimer = null; }
    this.open.set(true);
    // Show the full list on focus, even if the input already shows a name.
    this.query.set('');
    this.highlight.set(0);
  }

  onBlur() {
    // Defer so a click on an <li> can fire select() before we close.
    this.blurTimer = setTimeout(() => {
      this.open.set(false);
      this.onTouched();
      this.query.set(this.displayName()); // revert if user typed nonsense
    }, 120);
  }

  onInput(event: Event) {
    const v = (event.target as HTMLInputElement).value;
    this.query.set(v);
    this.open.set(true);
    this.highlight.set(0);

    // Typing clears the bound value. Picking an item below resets it.
    if (this.value() !== '') {
      this.value.set('');
      this.onChange('');
    }
  }

  select(lider: Lider) {
    if (this.blurTimer) { clearTimeout(this.blurTimer); this.blurTimer = null; }
    this.value.set(lider.id);
    this.query.set(`${lider.nombre} ${lider.apellido}`);
    this.open.set(false);
    this.onChange(lider.id);
  }

  onKeyDown(event: KeyboardEvent) {
    if (this.disabled()) return;
    const items = this.filtered();

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.open.set(true);
        if (items.length > 0) {
          this.highlight.update((h) => (h + 1) % items.length);
        }
        break;
      case 'ArrowUp':
        event.preventDefault();
        if (items.length > 0) {
          this.highlight.update((h) => (h - 1 + items.length) % items.length);
        }
        break;
      case 'Enter':
        if (this.open()) {
          event.preventDefault();
          const item = items[this.highlight()];
          if (item) this.select(item);
        }
        break;
      case 'Escape':
        this.open.set(false);
        this.query.set(this.displayName());
        break;
    }
  }
}
