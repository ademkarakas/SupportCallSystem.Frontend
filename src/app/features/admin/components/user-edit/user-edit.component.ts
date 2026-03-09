import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { AdminApiService } from '../../services/admin-api.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-user-edit',
  imports: [CommonModule, ReactiveFormsModule, MatIconModule, MatDialogModule],
  templateUrl: './user-edit.component.html',
  styleUrls: ['./user-edit.component.scss'],
})
export class UserEditComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly adminApi = inject(AdminApiService);
  private readonly notification = inject(NotificationService);
  private readonly dialog = inject(MatDialog);

  userId = signal<string | null>(null);
  isNew = signal(false);
  isSaving = signal(false);
  isDeleting = signal(false);
  isLoading = signal(false);
  lastModified = signal<string | null>(null);
  isDirty = signal(false);

  // Edit form (for existing users)
  editForm = this.fb.nonNullable.group({
    firstName: ['', Validators.required],
    lastName:  ['', Validators.required],
    email:     ['', [Validators.required, Validators.email]],
    extension: [''],
    role:      ['Agent', Validators.required],
  });

  // Create form (for new users)
  createForm = this.fb.nonNullable.group({
    userName: ['', Validators.required],
    email:    ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    extension: [''],
    role:     ['Agent', Validators.required],
  });

  private originalValues: unknown = null;

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.userId.set(id);
      this.loadUser(id);
    } else {
      this.isNew.set(true);
    }

    this.editForm.valueChanges.subscribe(() => {
      this.isDirty.set(this.editForm.dirty);
    });
  }

  private loadUser(id: string) {
    this.isLoading.set(true);
    this.adminApi.getUserById(id).subscribe({
      next: (user) => {
        let role = 'Agent';
        if (user.roles.includes('SystemAdmin')) role = 'SystemAdmin';
        else if (user.roles.includes('UserAdmin')) role = 'UserAdmin';

        this.editForm.patchValue({
          firstName: user.firstName,
          lastName:  user.lastName,
          email:     user.email,
          extension: user.extension,
          role,
        });
        this.originalValues = this.editForm.getRawValue();
        this.isLoading.set(false);
      },
      error: () => {
        this.notification.showError('Benutzer konnte nicht geladen werden.');
        this.router.navigate(['/admin/users']);
      },
    });
  }

  get pageTitle(): string {
    return this.isNew() ? 'Neuer Benutzer' : 'Benutzer bearbeiten';
  }

  isInvalid(form: 'edit' | 'create', field: string): boolean {
    if (form === 'edit') {
      const ctrl = this.editForm.get(field);
      return !!(ctrl?.invalid && ctrl?.touched);
    }
    const ctrl = this.createForm.get(field);
    return !!(ctrl?.invalid && ctrl?.touched);
  }

  save() {
    if (this.isNew()) {
      this.saveNew();
    } else {
      this.saveEdit();
    }
  }

  private saveNew() {
    if (this.createForm.invalid) { this.createForm.markAllAsTouched(); return; }
    this.isSaving.set(true);
    const v = this.createForm.getRawValue();
    this.adminApi.createUser({ userName: v.userName, email: v.email, password: v.password, role: v.role })
      .subscribe({
        next: () => {
          this.notification.showSuccess('Benutzer wurde erstellt.');
          this.router.navigate(['/admin/users']);
        },
        error: () => {
          this.notification.showError('Erstellen fehlgeschlagen.');
          this.isSaving.set(false);
        },
      });
  }

  private saveEdit() {
    const id = this.userId();
    if (!id || this.editForm.invalid) { this.editForm.markAllAsTouched(); return; }
    this.isSaving.set(true);
    const v = this.editForm.getRawValue();
    this.adminApi.updateUser(id, {
      firstName: v.firstName, lastName: v.lastName,
      email: v.email, extension: v.extension || '', role: v.role,
    }).subscribe({
      next: () => {
        this.notification.showSuccess('Benutzer wurde gespeichert.');
        this.originalValues = this.editForm.getRawValue();
        this.editForm.markAsPristine();
        this.isDirty.set(false);
        this.isSaving.set(false);
      },
      error: () => {
        this.notification.showError('Speichern fehlgeschlagen.');
        this.isSaving.set(false);
      },
    });
  }

  reset() {
    if (this.isNew()) {
      this.createForm.reset({ role: 'Agent' });
    } else if (this.originalValues) {
      this.editForm.patchValue(this.originalValues as never);
      this.editForm.markAsPristine();
      this.isDirty.set(false);
    }
  }

  deleteUser() {
    const id = this.userId();
    if (!id) return;

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Benutzer löschen',
        message: 'Möchten Sie diesen Benutzer wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.',
        danger: true,
      },
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (!confirmed) return;
      this.isDeleting.set(true);
      this.adminApi.deleteUser(id).subscribe({
        next: () => {
          this.notification.showSuccess('Benutzer wurde gelöscht.');
          this.router.navigate(['/admin/users']);
        },
        error: () => {
          this.notification.showError('Löschen fehlgeschlagen.');
          this.isDeleting.set(false);
        },
      });
    });
  }

  goBack() {
    this.router.navigate(['/admin/users']);
  }
}
