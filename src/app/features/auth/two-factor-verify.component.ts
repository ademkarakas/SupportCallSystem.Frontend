import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-two-factor-verify',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './two-factor-verify.component.html',
  styleUrls: ['./two-factor-verify.component.scss'],
})
export class TwoFactorVerifyComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly notification = inject(NotificationService);

  isLoading = signal(false);
  errorMessage = signal('');

  form = this.fb.group({
    code: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
  });

  private userId = '';

  ngOnInit(): void {
    this.userId = this.route.snapshot.queryParamMap.get('userId') ?? '';
    if (!this.userId) {
      this.router.navigate(['/login']);
    }
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    this.errorMessage.set('');
    this.isLoading.set(true);
    const code = this.form.getRawValue().code ?? '';

    this.authService
      .verifyTwoFactorLogin(this.userId, code)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: () => {
          this.notification.showSuccess('Anmeldung erfolgreich');
          this.router.navigate(['/dashboard']);
        },
        error: () => {
          this.errorMessage.set('Ungültiger Code. Bitte erneut versuchen.');
        },
      });
  }
}
