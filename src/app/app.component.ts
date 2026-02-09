import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <header class="shell-header">
      <h1>Restaurant QR Order</h1>
      <nav>
        <a routerLink="/menu" routerLinkActive="active">Menu</a>
        <a routerLink="/kitchen" routerLinkActive="active">Kitchen</a>
        <a routerLink="/admin" routerLinkActive="active">Admin</a>
      </nav>
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
        font-weight: 600;
      }

      a.active {
        color: #fff;
      }
    `
  ]
})
export class AppComponent {}
