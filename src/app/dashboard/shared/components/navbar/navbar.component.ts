import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { LucideDynamicIcon, LucideUsers, LucideGem, LucideLogOut, LucideMenu, LucideX } from '@lucide/angular';
import { AuthService } from 'src/app/auth/services/auth.service';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  imports: [RouterLink, RouterLinkActive, RouterOutlet, LucideDynamicIcon],
})
export class NavbarComponent {
  private authService = inject(AuthService);

  readonly Users = LucideUsers;
  readonly Gem = LucideGem;
  readonly LogOut = LucideLogOut;
  readonly Menu = LucideMenu;
  readonly X = LucideX;

  isOpen = signal(false);

  toggle() {
    this.isOpen.update((v) => !v);
  }

  close() {
    this.isOpen.set(false);
  }

  logOut() {
    this.authService.logOut();
  }
}
