import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { SupabaseService } from '../../core/services/supabase.service';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login-page.component.html'
})
export class LoginPageComponent {
  email = signal('');
  password = signal('');
  error = signal('');
  loading = signal(false);

  private readonly redirectUrl: string;

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly router: Router,
    route: ActivatedRoute
  ) {
    this.redirectUrl = route.snapshot.queryParamMap.get('redirect') ?? '/admin';
  }

  async login(): Promise<void> {
    this.error.set('');
    this.loading.set(true);

    try {
      const { error } = await this.supabaseService.getClient().auth.signInWithPassword({
        email: this.email().trim(),
        password: this.password()
      });

      if (error) {
        this.error.set(error.message);
        return;
      }

      await this.router.navigateByUrl(this.redirectUrl);
    } finally {
      this.loading.set(false);
    }
  }
}
