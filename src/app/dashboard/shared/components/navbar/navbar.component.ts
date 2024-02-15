import { Component } from '@angular/core';
import { AuthService } from 'src/app/auth/services/auth.service';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent {
  isSidebarOpen = false; // Boolean flag to track sidebar state

  constructor(
    private _authService: AuthService
  ) { }


  logOut() {
    this._authService.logOut();
  }

  toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
    document.getElementById('sidebar')?.classList.toggle('expand');
  }
}
