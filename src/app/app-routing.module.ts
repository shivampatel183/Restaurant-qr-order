import { Routes } from '@angular/router';

import { AdminPageComponent } from './pages/admin/admin-page.component';
import { KitchenPageComponent } from './pages/kitchen/kitchen-page.component';
import { MenuPageComponent } from './pages/menu/menu-page.component';
import { adminGuard } from './core/guards/admin.guard';

export const appRoutes: Routes = [
  { path: '', redirectTo: 'menu', pathMatch: 'full' },
  { path: 'menu', component: MenuPageComponent },
  { path: 'kitchen', component: KitchenPageComponent, canActivate: [adminGuard] },
  { path: 'admin', component: AdminPageComponent, canActivate: [adminGuard] },
  { path: '**', redirectTo: 'menu' }
];
