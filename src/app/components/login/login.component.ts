import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SupabaseService } from '../../services/supabase.service';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  email: string = '';
  password: string = '';
  loading: boolean = false;
  errorMessage: string = '';

  constructor(
    private supabaseService: SupabaseService,
    private router: Router
  ) { }

  async onSubmit() {
    if (!this.email || !this.password) {
      this.errorMessage = 'Por favor ingrese email y contraseña';
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    try {
      const { data, error } = await this.supabaseService.signIn(this.email, this.password);

      if (error) throw error;

      const user = data.user;
      if (!user) throw new Error('Usuario no encontrado');

      // Obtener rol del usuario desde la tabla usuarios
      const usuario = await this.supabaseService.obtenerUsuarioPorId(user.id);

      if (usuario && usuario.rol) {
        this.redirigirPorRol(usuario.rol);
      } else {
        throw new Error('No se pudo determinar el rol del usuario');
      }
    } catch (error: any) {
      this.errorMessage = error.message || 'Error al iniciar sesión';
      console.error('Error de login:', error);
    } finally {
      this.loading = false;
    }
  }

  private redirigirPorRol(rol: string) {
    switch (rol) {
      case 'planta':
        this.router.navigate(['/dashboard-planta']);
        break;
      case 'cd':
        this.router.navigate(['/dashboard-cd']);
        break;
      case 'admin':
        this.router.navigate(['/monitor-ramplas']);
        break;
      default:
        this.router.navigate(['/dashboard-planta']);
    }
  }
}
