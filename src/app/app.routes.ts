import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { DashboardPlantaComponent } from './components/dashboard-planta/dashboard-planta.component';
import { DashboardCdComponent } from './components/dashboard-cd/dashboard-cd.component';
import { DashboardGalponComponent } from './components/dashboard-galpon/dashboard-galpon.component';
import { MonitorRamplasComponent } from './components/monitor-ramplas/monitor-ramplas.component';
import { MonitorMuellesComponent } from './components/monitor-muelles/monitor-muelles.component';
import { DetalleTicketComponent } from './components/detalle-ticket/detalle-ticket.component';
import { NotificacionesComponent } from './components/notificaciones/notificaciones.component';
import { GestionMuellesComponent } from './components/gestion-muelles/gestion-muelles.component';
import { ReportesCdComponent } from './components/reportes-cd/reportes-cd.component';
import { AuthGuard } from './guards/auth.guard';
import { DashboardAdminComponent } from './components/dashboard-admin/dashboard-admin.component';

export const routes: Routes = [
    {
        path: '',
        redirectTo: '/login',
        pathMatch: 'full'
    },
    {
        path: 'login',
        component: LoginComponent
    },
    {
        path: 'dashboard-admin',
        component: DashboardAdminComponent,
        canActivate: [AuthGuard]
    },
    {
        path: 'dashboard-planta',
        component: DashboardPlantaComponent,
        canActivate: [AuthGuard]
    },
    {
        path: 'dashboard-cd',
        component: DashboardCdComponent,
        canActivate: [AuthGuard]
    },
    {
        path: 'dashboard-galpon',
        component: DashboardGalponComponent,
        canActivate: [AuthGuard]
    },
    {
        path: 'monitor-ramplas',
        component: MonitorRamplasComponent,
        canActivate: [AuthGuard]
    },
    {
        path: 'monitor-muelles',
        component: MonitorMuellesComponent,
        canActivate: [AuthGuard]
    },
    {
        path: 'detalle-ticket/:id',
        component: DetalleTicketComponent,
        canActivate: [AuthGuard]
    },
    {
        path: 'notificaciones',
        component: NotificacionesComponent,
        canActivate: [AuthGuard]
    },
    {
        path: 'gestion-muelles',
        component: GestionMuellesComponent,
        canActivate: [AuthGuard]
    },
    {
        path: 'reportes-cd',
        component: ReportesCdComponent,
        canActivate: [AuthGuard]
    },
    {
        path: '**',
        redirectTo: '/login'
    }
];
