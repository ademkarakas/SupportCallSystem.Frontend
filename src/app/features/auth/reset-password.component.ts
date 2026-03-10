import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  Validators,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { HttpClient } from '@angular/common/http';
import { finalize } from 'rxjs';
import { environment } from '../../../environments/environment';

function passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
  const pw = control.get('newPassword');
  const confirm = control.get('confirmPassword');
  if (pw && confirm && pw.value !== confirm.value) {
    return { passwordMismatch: true };
  }
  return null;
}

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss'],
})
export class ResetPasswordComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly http = inject(HttpClient);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  isLoading = signal(false);
  success = signal(false);
  errorMessage = signal('');
  hideNew = signal(true);
  hideConfirm = signal(true);

  private email = '';
  private token = '';

  form = this.fb.group(
    {
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: passwordMatchValidator },
  );

  ngOnInit(): void {
    this.email = this.route.snapshot.queryParams['email'] ?? '';
    this.token = this.route.snapshot.queryParams['token'] ?? '';
    if (!this.email || !this.token) {
      this.errorMessage.set('Ungültiger Reset-Link. Bitte fordern Sie einen neuen an.');
    }
  }

  onSubmit(): void {
    if (this.form.invalid || !this.email || !this.token) return;

    this.isLoading.set(true);
    this.errorMessage.set('');
    const { newPassword } = this.form.getRawValue();

    this.http
      .post<void>(`${environment.apiUrl}/api/auth/reset-password`, {
        email: this.email,
        token: this.token,
        newPassword,
      })
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: () => this.success.set(true),
        error: (err) => {
          const msg = err?.error?.error ?? err?.error?.message ?? 'Fehler beim Zurücksetzen.';
          this.errorMessage.set(msg);
        },
      });
  }

  navigateToLogin(): void {
    this.router.navigate(['/login']);
  }
}
