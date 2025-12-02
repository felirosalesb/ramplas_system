import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet } from '@angular/router';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { NotificacionesPanelComponent } from './components/notificaciones-panel/notificaciones-panel.component';
import { SupabaseService } from './services/supabase.service';

@Component({
  selector: 'app-root',
  imports: [CommonModule, RouterOutlet, MatSnackBarModule, NotificacionesPanelComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'ramplas-system';
  constructor(private router: Router, private supabaseService: SupabaseService) { }

  get mostrarNotificaciones(): boolean {
    const url = this.router.url || '';
    const esLogin = url.startsWith('/login') || url === '/';
    const user = this.supabaseService.getCurrentUser();
    return !!user && !esLogin;
  }
}
