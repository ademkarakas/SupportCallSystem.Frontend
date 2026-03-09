import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { AdminApiService, UserDto } from '../../services/admin-api.service';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-user-form-dialog',
  imports: [CommonModule, ReactiveFormsModule, MatDialogModule, MatIconModule],
  template: `
    <div class="edit-dialog">

      <!-- Header -->
      <div class="edit-header">
        <div class="header-left">
          <div class="user-avatar">{{ initials }}</div>
          <div class="header-info">
            <h2 class="dialog-title">Benutzer bearbeiten</h2>
            <p class="dialog-subtitle">{{ data.firstName }} {{ data.lastName }}</p>
          </div>
        </div>
        <button class="close-btn" (click)="dialogRef.close()" title="Schließen">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <!-- Form Body -->
      <div class="edit-body">
        <form [formGroup]="form" (ngSubmit)="save()" novalidate>

          <!-- Name Row -->
          <div class="form-row two-col">
            <div class="form-field-group">
              <label class="form-label">Vorname <span class="required">*</span></label>
              <div class="input-wrapper" [class.error]="isInvalid('firstName')">
                <mat-icon class="input-icon">badge</mat-icon>
                <input class="form-input with-icon" formControlName="firstName" placeholder="Max" />
              </div>
              @if (isInvalid('firstName')) {
                <span class="field-error"><mat-icon>error_outline</mat-icon> Pflichtfeld</span>
              }
            </div>
            <div class="form-field-group">
              <label class="form-label">Nachname <span class="required">*</span></label>
              <div class="input-wrapper" [class.error]="isInvalid('lastName')">
                <mat-icon class="input-icon">badge</mat-icon>
                <input class="form-input with-icon" formControlName="lastName" placeholder="Mustermann" />
              </div>
              @if (isInvalid('lastName')) {
                <span class="field-error"><mat-icon>error_outline</mat-icon> Pflichtfeld</span>
              }
            </div>
          </div>

          <!-- Email -->
          <div class="form-field-group">
            <label class="form-label">E-Mail-Adresse <span class="required">*</span></label>
            <div class="input-wrapper" [class.error]="isInvalid('email')">
              <mat-icon class="input-icon">mail</mat-icon>
              <input class="form-input with-icon" formControlName="email" type="email" placeholder="max@firma.de" />
            </div>
            @if (isInvalid('email')) {
              <span class="field-error"><mat-icon>error_outline</mat-icon> Gültige E-Mail erforderlich</span>
            }
          </div>

          <!-- Extension -->
          <div class="form-field-group">
            <label class="form-label">Nebenstelle</label>
            <div class="input-wrapper">
              <mat-icon class="input-icon">phone_in_talk</mat-icon>
              <input class="form-input with-icon" formControlName="extension" placeholder="z.B. 101" />
            </div>
          </div>

          <!-- Role -->
          <div class="form-field-group">
            <label class="form-label">Rolle <span class="required">*</span></label>
            <div class="input-wrapper select-wrapper">
              <mat-icon class="input-icon">shield</mat-icon>
              <select class="form-input with-icon form-select" formControlName="role">
                <option value="Agent">Agent</option>
                <option value="UserAdmin">User Admin</option>
                <option value="SystemAdmin">System Admin</option>
              </select>
              <mat-icon class="select-arrow">expand_more</mat-icon>
            </div>
          </div>

        </form>
      </div>

      <!-- Footer -->
      <div class="edit-footer">
        <button class="btn-secondary" type="button" (click)="dialogRef.close()">Abbrechen</button>
        <button
          class="btn-primary"
          type="button"
          [disabled]="form.invalid || isSaving"
          (click)="save()"
        >
          @if (isSaving) {
            <mat-icon class="btn-spinner">sync</mat-icon>
            Wird gespeichert…
          } @else {
            <mat-icon>save</mat-icon>
            Speichern
          }
        </button>
      </div>
    </div>
  `,
  styles: [`
    .edit-dialog {
      display: flex;
      flex-direction: column;
      width: 520px;
      max-width: 96vw;
      background: #fff;
      border-radius: 16px;
      overflow: hidden;
    }

    /* Header */
    .edit-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 20px 24px;
      background: linear-gradient(135deg, #0f62c4 0%, #0078d4 100%);
      flex-shrink: 0;
    }
    .header-left {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .user-avatar {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      background: rgba(255,255,255,0.2);
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1rem;
      font-weight: 700;
      letter-spacing: 0.05em;
      flex-shrink: 0;
    }
    .dialog-title {
      font-size: 1.05rem;
      font-weight: 700;
      color: #fff;
      margin: 0 0 3px;
    }
    .dialog-subtitle {
      font-size: 0.8rem;
      color: rgba(255,255,255,0.75);
      margin: 0;
    }
    .close-btn {
      background: rgba(255,255,255,0.15);
      border: none;
      border-radius: 8px;
      width: 34px;
      height: 34px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: #fff;
      transition: background 0.2s;
      mat-icon { font-size: 18px; width: 18px; height: 18px; }
      &:hover { background: rgba(255,255,255,0.28); }
    }

    /* Body */
    .edit-body {
      padding: 24px 24px 16px;
      overflow-y: auto;
      flex: 1;
    }

    .form-row.two-col {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px;
    }

    .form-field-group {
      display: flex;
      flex-direction: column;
      margin-bottom: 16px;
    }

    .form-label {
      font-size: 0.82rem;
      font-weight: 600;
      color: #333;
      margin-bottom: 6px;
    }
    .required { color: #e8590c; margin-left: 2px; }

    .input-wrapper {
      position: relative;
      display: flex;
      align-items: center;
      border: 1.5px solid rgba(0,0,0,0.18);
      border-radius: 10px;
      background: #fafafa;
      transition: border-color 0.2s, box-shadow 0.2s;

      &:focus-within {
        border-color: #0078d4;
        box-shadow: 0 0 0 3px rgba(0,120,212,0.12);
        background: #fff;
      }
      &.error {
        border-color: #dc2626;
        &:focus-within { box-shadow: 0 0 0 3px rgba(220,38,38,0.12); }
      }
    }

    .input-icon {
      position: absolute;
      left: 12px;
      font-size: 18px !important;
      width: 18px !important;
      height: 18px !important;
      color: #888;
      pointer-events: none;
    }

    .form-input {
      width: 100%;
      border: none;
      background: transparent;
      padding: 10px 12px;
      font-size: 0.9rem;
      color: #1a1a1a;
      outline: none;
      border-radius: 10px;

      &.with-icon { padding-left: 42px; }
      &::placeholder { color: #bbb; }
    }

    .select-wrapper { position: relative; }
    .form-select {
      appearance: none;
      cursor: pointer;
      padding-right: 36px;
    }
    .select-arrow {
      position: absolute;
      right: 10px;
      left: auto !important;
      color: #888;
      pointer-events: none;
    }

    .field-error {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 0.75rem;
      color: #dc2626;
      margin-top: 4px;
      mat-icon { font-size: 14px !important; width: 14px !important; height: 14px !important; }
    }

    /* Footer */
    .edit-footer {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      padding: 16px 24px;
      border-top: 1px solid rgba(0,0,0,0.08);
      flex-shrink: 0;
    }

    .btn-secondary {
      padding: 9px 20px;
      border: 1.5px solid rgba(0,0,0,0.18);
      border-radius: 10px;
      background: #fff;
      font-size: 0.875rem;
      font-weight: 600;
      color: #444;
      cursor: pointer;
      transition: all 0.2s;
      &:hover { background: #f5f5f5; border-color: rgba(0,0,0,0.28); }
    }

    .btn-primary {
      display: flex;
      align-items: center;
      gap: 7px;
      padding: 9px 22px;
      border: none;
      border-radius: 10px;
      background: linear-gradient(135deg, #0f62c4, #0078d4);
      font-size: 0.875rem;
      font-weight: 700;
      color: #fff;
      cursor: pointer;
      transition: all 0.2s;
      mat-icon { font-size: 18px !important; width: 18px !important; height: 18px !important; }

      &:hover:not(:disabled) { background: linear-gradient(135deg, #0a52a8, #006bbf); }
      &:disabled { opacity: 0.55; cursor: not-allowed; }
    }

    .btn-spinner {
      animation: spin 1s linear infinite;
    }
    @keyframes spin { 100% { transform: rotate(360deg); } }
  `],
})
export class UserFormDialogComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly adminApi = inject(AdminApiService);
  private readonly notification = inject(NotificationService);
  readonly data = inject<UserDto>(MAT_DIALOG_DATA);
  readonly dialogRef = inject(MatDialogRef<UserFormDialogComponent>);

  isSaving = false;

  form = this.fb.nonNullable.group({
    firstName: ['', Validators.required],
    lastName:  ['', Validators.required],
    email:     ['', [Validators.required, Validators.email]],
    extension: [''],
    role:      ['Agent', Validators.required],
  });

  get initials(): string {
    return ((this.data?.firstName?.[0] ?? '') + (this.data?.lastName?.[0] ?? '')).toUpperCase();
  }

  ngOnInit() {
    if (this.data) {
      let primaryRole = 'Agent';
      if (this.data.roles.includes('SystemAdmin')) primaryRole = 'SystemAdmin';
      else if (this.data.roles.includes('UserAdmin')) primaryRole = 'UserAdmin';

      this.form.patchValue({
        firstName: this.data.firstName,
        lastName:  this.data.lastName,
        email:     this.data.email,
        extension: this.data.extension,
        role:      primaryRole,
      });
    }
  }

  isInvalid(field: string): boolean {
    const ctrl = this.form.get(field);
    return !!(ctrl?.invalid && ctrl?.touched);
  }

  save() {
    if (this.form.invalid) return;
    this.isSaving = true;
    const val = this.form.getRawValue();
    this.adminApi
      .updateUser(this.data.id, {
        firstName: val.firstName,
        lastName:  val.lastName,
        email:     val.email,
        extension: val.extension || '',
        role:      val.role,
      })
      .subscribe({
        next: () => {
          this.notification.showSuccess('Benutzer wurde aktualisiert.');
          this.dialogRef.close(true);
        },
        error: () => {
          this.notification.showError('Aktualisierung fehlgeschlagen.');
          this.isSaving = false;
        },
      });
  }
}

