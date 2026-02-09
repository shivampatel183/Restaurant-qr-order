import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SupabaseService } from '../services/supabase.service';

export const adminGuard: CanActivateFn = async () => {
  const supabase = inject(SupabaseService).getClient();
  const router = inject(Router);

  const { data } = await supabase.auth.getSession();

  if (data.session?.user) {
    return true;
  }

  void router.navigate(['/menu']);
  return false;
};
