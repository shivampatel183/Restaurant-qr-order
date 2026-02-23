import { Routes } from "@angular/router";

import { AdminPageComponent } from "./pages/admin/admin-page.component";
import { AdminOrderPageComponent } from "./pages/admin-order/admin-order-page.component";
import { AdminRecentOrdersPageComponent } from "./pages/admin-recent-orders/admin-recent-orders-page.component";
import { KitchenPageComponent } from "./pages/kitchen/kitchen-page.component";
import { LoginPageComponent } from "./pages/login/login-page.component";
import { MenuPageComponent } from "./pages/menu/menu-page.component";
import { adminGuard } from "./core/guards/admin.guard";

export const appRoutes: Routes = [
  { path: "menu", component: MenuPageComponent },
  { path: "login", component: LoginPageComponent },
  {
    path: "kitchen",
    component: KitchenPageComponent,
    canActivate: [adminGuard],
  },
  {
    path: "admin/order",
    component: AdminOrderPageComponent,
    canActivate: [adminGuard],
  },
  {
    path: "admin/recent-orders",
    component: AdminRecentOrdersPageComponent,
    canActivate: [adminGuard],
  },
  { path: "admin", component: AdminPageComponent, canActivate: [adminGuard] },
  { path: "**", redirectTo: "menu" },
];
