import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { AuthService, User } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';

/**
 * User Settings Dialog Component
 *
 * Displays a modal dialog allowing the user to view and update their
 * profile information (name, email) and change their password.
 * Uses reactive forms with validation and follows the DIONE ERP design system.
 */
@Component({
  selector: 'app-user-settings-dialog',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatIconModule,
    MatButtonModule,
    MatDividerModule,
  ],
  templateUrl: './user-settings-dialog.component.html',
  styleUrls: ['./user-settings-dialog.component.scss'],
})
export class UserSettingsDialogComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<UserSettingsDialogComponent>);
  readonly auth = inject(AuthService);
  private readonly notification = inject(NotificationService);

  /** Active sidebar tab */
  activeTab = signal<'profil' | 'sicherheit' | 'info'>('profil');

  /** Currently authenticated user */
  currentUser = signal<User | null>(null);

  /** Loading state for save operations */
  isSaving = signal(false);

  /** Whether password is visible in username field */
  showCurrentPassword = signal(false);
  showNewPassword = signal(false);
  showConfirmPassword = signal(false);

  /** Profile form */
  profileForm!: FormGroup;

  /** Password change form */
  passwordForm!: FormGroup;

  ngOnInit(): void {
    const user = this.auth.currentUser();
    this.currentUser.set(user);
    this.initForms(user);
  }

  /**
   * Initializes the profile and password forms with validators.
   * @param user - The current authenticated user
   */
  private initForms(user: User | null): void {
    this.profileForm = this.fb.group({
      firstName: [
        user?.firstName ?? '',
        [Validators.required, Validators.minLength(2), Validators.maxLength(60)],
      ],
      lastName: [
        user?.lastName ?? '',
        [Validators.required, Validators.minLength(2), Validators.maxLength(60)],
      ],
      email: [
        user?.email ?? '',
        [Validators.required, Validators.email, Validators.maxLength(120)],
      ],
      extension: [user?.extension ?? '', [Validators.maxLength(20)]],
    });

    this.passwordForm = this.fb.group(
      {
        currentPassword: ['', [Validators.required, Validators.minLength(6)]],
        newPassword: [
          '',
          [
            Validators.required,
            Validators.minLength(8),
            Validators.pattern(/^(?=.*[0-9])(?=.*[!@#$%^&*])/),
          ],
        ],
        confirmPassword: ['', Validators.required],
      },
      { validators: this.passwordMatchValidator },
    );
  }

  /**
   * Cross-field validator: ensures newPassword and confirmPassword match.
   */
  private passwordMatchValidator(group: FormGroup): { [key: string]: boolean } | null {
    const newPw = group.get('newPassword')?.value;
    const confirmPw = group.get('confirmPassword')?.value;
    if (newPw && confirmPw && newPw !== confirmPw) {
      return { passwordMismatch: true };
    }
    return null;
  }

  /** Returns user initials for the avatar. */
  get userInitials(): string {
    const user = this.currentUser();
    if (!user) return '?';
    const first = user.firstName?.[0] ?? '';
    const last = user.lastName?.[0] ?? '';
    return (first + last).toUpperCase();
  }

  /** Saves the profile form. */
  saveProfile(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    const user = this.currentUser();
    if (!user) return;

    this.isSaving.set(true);

    this.auth
      .updateProfile({
        userId: user.id,
        ...this.profileForm.value,
      })
      .subscribe({
        next: () => {
          this.isSaving.set(false);
          this.notification.showSuccess('Profil erfolgreich aktualisiert');
          this.dialogRef.close();
        },
        error: () => {
          this.isSaving.set(false);
          this.notification.showError('Fehler beim Aktualisieren des Profils');
        },
      });
  }

  /** Saves the new password. */
  changePassword(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    const user = this.currentUser();
    if (!user) return;

    this.isSaving.set(true);

    this.auth
      .changePassword({
        userId: user.id,
        currentPassword: this.passwordForm.value.currentPassword,
        newPassword: this.passwordForm.value.newPassword,
      })
      .subscribe({
        next: () => {
          this.isSaving.set(false);
          this.passwordForm.reset();
          this.notification.showSuccess('Passwort erfolgreich geändert');
        },
        error: () => {
          this.isSaving.set(false);
          this.notification.showError(
            'Fehler beim Ändern des Passworts. Bitte aktuelles Passwort prüfen.',
          );
        },
      });
  }

  /** Returns a validation error message for a form control. */
  getError(form: FormGroup, controlName: string): string {
    const control = form.get(controlName);
    if (!control || !control.errors || !control.touched) return '';

    const errors = control.errors;
    if (errors['required']) return 'Pflichtfeld';
    if (errors['minlength']) {
      const min = errors['minlength'].requiredLength;
      return `Mindestens ${min} Zeichen`;
    }
    if (errors['maxlength']) {
      const max = errors['maxlength'].requiredLength;
      return `Maximal ${max} Zeichen`;
    }
    if (errors['email']) return 'Ungültige E-Mail-Adresse';
    if (errors['pattern']) return 'Muss mind. eine Zahl und ein Sonderzeichen enthalten';
    return 'Ungültige Eingabe';
  }

  /** Returns whether the cross-field password mismatch error should show. */
  get passwordMismatch(): boolean {
    return (
      !!this.passwordForm.errors?.['passwordMismatch'] &&
      !!this.passwordForm.get('confirmPassword')?.touched
    );
  }

  /** Switches the active sidebar tab. */
  setTab(tab: 'profil' | 'sicherheit' | 'info'): void {
    this.activeTab.set(tab);
  }

  /** Closes the dialog without saving. */
  close(): void {
    this.dialogRef.close();
  }

  toggleCurrentPasswordVisibility(): void {
    this.showCurrentPassword.set(!this.showCurrentPassword());
  }

  toggleNewPasswordVisibility(): void {
    this.showNewPassword.set(!this.showNewPassword());
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword.set(!this.showConfirmPassword());
  }
}
