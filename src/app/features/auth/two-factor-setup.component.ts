import { Component, signal, inject, OnInit, SecurityContext } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { AuthService, TwoFactorSetupInfo } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-two-factor-setup',
  imports: [CommonModule, ReactiveFormsModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './two-factor-setup.component.html',
  styleUrls: ['./two-factor-setup.component.scss'],
})
export class TwoFactorSetupComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly notification = inject(NotificationService);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly fb = inject(FormBuilder);

  isLoading = signal(false);
  setupInfo = signal<TwoFactorSetupInfo | null>(null);
  isEnabled = signal(false);
  showSetup = signal(false);
  setupStep = signal<1 | 2 | 3>(1);

  safeQrSvg = signal<SafeHtml>('');

  enableForm = this.fb.group({
    code: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
  });

  ngOnInit(): void {
    this.loadStatus();
  }

  private loadStatus(): void {
    this.isLoading.set(true);
    this.authService
      .getTwoFactorStatus()
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (res) => this.isEnabled.set(res.enabled),
        error: () => this.notification.showError('Status konnte nicht geladen werden'),
      });
  }

  loadSetupInfo(): void {
    this.isLoading.set(true);
    this.authService
      .getTwoFactorSetup()
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (info) => {
          this.setupInfo.set(info);
          const sanitizedSvg = this.sanitizer.sanitize(SecurityContext.HTML, info.qrCodeSvg) ?? '';
          this.safeQrSvg.set(this.sanitizer.bypassSecurityTrustHtml(sanitizedSvg));
          this.showSetup.set(true);
          this.setupStep.set(1);
        },
        error: () =>
          this.notification.showError('Setup-Informationen konnten nicht geladen werden'),
      });
  }

  enableTwoFactor(): void {
    if (this.enableForm.invalid) return;

    this.isLoading.set(true);
    const code = this.enableForm.getRawValue().code ?? '';

    this.authService
      .enableTwoFactor(code)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: () => {
          this.isEnabled.set(true);
          this.showSetup.set(false);
          this.enableForm.reset();
          this.notification.showSuccess('2FA erfolgreich aktiviert');
        },
        error: () => {
          this.notification.showError('Ungültiger Code. Bitte erneut versuchen.');
        },
      });
  }

  copyKey(key: string): void {
    navigator.clipboard.writeText(key).then(
      () => this.notification.showSuccess('Schlüssel kopiert'),
      () => this.notification.showError('Kopieren fehlgeschlagen'),
    );
  }

  nextStep(): void {
    const s = this.setupStep();
    if (s < 3) this.setupStep.set((s + 1) as 1 | 2 | 3);
  }

  prevStep(): void {
    const s = this.setupStep();
    if (s > 1) this.setupStep.set((s - 1) as 1 | 2 | 3);
  }

  disableTwoFactor(): void {
    if (!confirm('2FA wirklich deaktivieren? Ihr Konto wird weniger sicher.')) return;

    this.isLoading.set(true);
    this.authService
      .disableTwoFactor()
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: () => {
          this.isEnabled.set(false);
          this.setupInfo.set(null);
          this.notification.showSuccess('2FA deaktiviert');
        },
        error: () => this.notification.showError('Deaktivierung fehlgeschlagen'),
      });
  }
}
