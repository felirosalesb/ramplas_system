import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { SupabaseService } from '../../services/supabase.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatBadgeModule,
    MatMenuModule,
    MatDividerModule
  ],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent implements OnInit {
  notificacionesCount = 0;
  userEmail: string = '';
  userRole: string = '';

  constructor(
    private supabaseService: SupabaseService,
    private notificationService: NotificationService,
    private router: Router
  ) { }

  async ngOnInit() {
    const user = this.supabaseService.getCurrentUser();
    this.userEmail = user?.email || '';

    // Obtener el rol del usuario
    if (user) {
      const usuario = await this.supabaseService.obtenerUsuarioPorId(user.id);
      this.userRole = usuario?.rol || '';
    }

    this.notificationService.notificaciones$.subscribe(notificaciones => {
      this.notificacionesCount = notificaciones.filter(n => !n.leido).length;
    });
  }

  // Mostrar Monitor solo para CD y Admin
  get mostrarMonitor(): boolean {
    return this.userRole === 'cd' || this.userRole === 'admin';
  }

  // Mostrar link al dashboard según rol
  get dashboardLink(): string {
    switch (this.userRole) {
      case 'planta':
        return '/dashboard-planta';
      case 'cd':
        return '/dashboard-cd';
      case 'admin':
        return '/monitor-ramplas';
      default:
        return '/';
    }
  }

  get dashboardLabel(): string {
    switch (this.userRole) {
      case 'planta':
        return 'Mis Solicitudes';
      case 'cd':
        return 'Dashboard CD';
      case 'admin':
        return 'Panel Admin';
      default:
        return 'Inicio';
    }
  }

  irANotificaciones() {
    this.router.navigate(['/notificaciones']);
  }

  async cerrarSesion() {
    await this.supabaseService.signOut();
    this.router.navigate(['/login']);
  }
}
