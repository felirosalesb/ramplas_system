import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { DashboardPlantaComponent } from './components/dashboard-planta/dashboard-planta.component';
import { DashboardCdComponent } from './components/dashboard-cd/dashboard-cd.component';
import { DashboardAdminComponent } from './components/dashboard-admin/dashboard-admin.component';
import { MonitorRamplasComponent } from './components/monitor-ramplas/monitor-ramplas.component';
import { DetalleTicketComponent } from './components/detalle-ticket/detalle-ticket.component';
import { NotificacionesComponent } from './components/notificaciones/notificaciones.component';
import { AuthGuard } from './guards/auth.guard';

const routes: Routes = [
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
        path: 'dashboard-admin',
        component: DashboardAdminComponent,
        canActivate: [AuthGuard]
    },
    {
        path: 'monitor-ramplas',
        component: MonitorRamplasComponent,
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
        path: '**',
        redirectTo: '/login'
    }
];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule]
})
export class AppRoutingModule { }
