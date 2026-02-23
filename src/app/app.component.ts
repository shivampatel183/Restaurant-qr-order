import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthChangeEvent, Session, Subscription } from '@supabase/supabase-js';
import { SettingsService } from './core/services/settings.service';
import { SupabaseService } from './core/services/supabase.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <header class="shell-header">
      <h1>{{ settingsService.restaurantName() }}</h1>
      @if (isLoggedIn()) {
        <nav>
          <a routerLink="/menu" routerLinkActive="active">Menu</a>
          <a routerLink="/kitchen" routerLinkActive="active">Kitchen</a>
          <a routerLink="/admin/recent-orders" routerLinkActive="active">Recent Orders</a>
          <a routerLink="/admin" routerLinkActive="active">Admin</a>
          <button type="button" class="logout-btn" (click)="logout()">Logout</button>
        </nav>
      }
    </header>

    <main>
      <router-outlet></router-outlet>
    </main>
  `,
  styles: [
    `
      .shell-header {
        background: #0f172a;
        color: #fff;
        display: flex;
        flex-wrap: wrap;
        justify-content: space-between;
        align-items: center;
        gap: 1rem;
        padding: 1rem;
      }

      h1 {
        margin: 0;
        font-size: 1.3rem;
      }

      small {
        color: #94a3b8;
        gap: 1rem;
        justify-content: space-between;
        align-items: center;
        padding: 1rem 1.5rem;
      }

      nav {
        display: flex;
        gap: 1rem;
      }

      a {
        color: #cbd5e1;
        text-decoration: none;
        font-weight: 700;
        font-weight: 600;
      }

      a.active {
        color: #fff;
      }

      .logout-btn {
        border: 1px solid #475569;
        background: transparent;
        color: #cbd5e1;
        border-radius: 0.4rem;
        padding: 0.35rem 0.65rem;
        cursor: pointer;
        font-weight: 600;
      }

      .logout-btn:hover {
        color: #fff;
        border-color: #94a3b8;
      }
    `
  ]
})
export class AppComponent implements OnInit, OnDestroy {
  isLoggedIn = signal(false);
  private authSubscription?: Subscription;

  constructor(
    private readonly supabaseService: SupabaseService,
    public readonly settingsService: SettingsService,
    private readonly router: Router
  ) {}

  async ngOnInit(): Promise<void> {
    await this.settingsService.loadTaxPercent();
    const auth = this.supabaseService.getClient().auth;
    const session = await auth.getSession();
    this.isLoggedIn.set(Boolean(session.data.session?.user));

    this.authSubscription = auth.onAuthStateChange(
      (_event: AuthChangeEvent, sessionData: Session | null) => {
        this.isLoggedIn.set(Boolean(sessionData?.user));
      }
    ).data.subscription;
  }

  ngOnDestroy(): void {
    this.authSubscription?.unsubscribe();
  }

  async logout(): Promise<void> {
    await this.supabaseService.getClient().auth.signOut();
    this.isLoggedIn.set(false);
    await this.router.navigateByUrl('/login');
  }
}
