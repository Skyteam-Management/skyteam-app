import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToasterComponent } from './shared/components/toaster/toaster.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  imports: [RouterOutlet, ToasterComponent],
})
export class AppComponent {}
