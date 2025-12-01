import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { NotificacionesPanelComponent } from './components/notificaciones-panel/notificaciones-panel.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, MatSnackBarModule, NotificacionesPanelComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'ramplas-system';
}
