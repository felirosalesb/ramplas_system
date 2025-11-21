import { Component, OnInit } from '@angular/core';
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
export class LoginComponent implements OnInit {
  email: string = '';
  password: string = '';
  loading: boolean = false;
  errorMessage: string = '';

  constructor(
    private supabaseService: SupabaseService,
    private router: Router
  ) { }

  async ngOnInit() {
    console.log('=== LOGIN COMPONENT INIT ===');
    // Verificar si ya hay un usuario autenticado
    const user = this.supabaseService.getCurrentUser();

    if (user) {
      console.log('Usuario ya autenticado detectado:', user.id);
      // Obtener rol y redirigir
      const usuario = await this.supabaseService.obtenerUsuarioPorId(user.id);

      if (usuario && usuario.rol) {
        console.log('Usuario ya tiene sesión activa con rol:', usuario.rol);
        this.redirigirPorRol(usuario.rol);
      }
    } else {
      console.log('No hay usuario autenticado, mostrando formulario de login');
    }
  }

  async onSubmit() {
    if (!this.email || !this.password) {
      this.errorMessage = 'Por favor ingrese email y contraseña';
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    try {
      console.log('=== INICIO LOGIN ===');
      console.log('Email:', this.email);

      const { data, error } = await this.supabaseService.signIn(this.email, this.password);

      if (error) {
        console.error('Error en signIn:', error);
        throw error;
      }

      const user = data.user;
      if (!user) {
        console.error('No se obtuvo usuario de Supabase Auth');
        throw new Error('Usuario no encontrado');
      }

      console.log('Usuario autenticado:', user.id, user.email);

      // Obtener rol del usuario desde la tabla usuarios
      const usuario = await this.supabaseService.obtenerUsuarioPorId(user.id);

      console.log('Usuario obtenido de tabla usuarios:', usuario);

      if (usuario && usuario.rol) {
        console.log('Redirigiendo a rol:', usuario.rol);
        this.redirigirPorRol(usuario.rol);
      } else {
        console.error('No se pudo obtener el rol. Usuario:', usuario);
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
    console.log('=== REDIRIGIR POR ROL ===');
    console.log('Rol recibido:', rol);

    let ruta = '';

    switch (rol) {
      case 'planta':
        ruta = '/dashboard-planta';
        break;
      case 'cd':
        ruta = '/dashboard-cd';
        break;
      case 'admin':
        ruta = '/dashboard-admin';
        break;
      default:
        ruta = '/dashboard-planta';
    }

    console.log('Navegando a:', ruta);

    // Usar navigateByUrl para forzar la navegación
    this.router.navigateByUrl(ruta).then(
      (success) => console.log('Navegación exitosa:', success),
      (error) => console.error('Error en navegación:', error)
    );
  }
}
