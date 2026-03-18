import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { AdminApiService, CallHistoryItemDto } from '../../services/admin-api.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-customer-edit',
  imports: [CommonModule, ReactiveFormsModule, MatIconModule, MatDialogModule],
  templateUrl: './customer-edit.component.html',
  styleUrls: ['./customer-edit.component.scss'],
})
export class CustomerEditComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly adminApi = inject(AdminApiService);
  private readonly notification = inject(NotificationService);
  private readonly dialog = inject(MatDialog);
  private readonly destroyRef = inject(DestroyRef);

  customerId = signal<string | null>(null);
  isNew = signal(false);
  isSaving = signal(false);
  isDeleting = signal(false);
  isLoading = signal(false);
  isDirty = signal(false);

  callHistory = signal<CallHistoryItemDto[]>([]);
  isHistoryLoading = signal(false);
  selectedCall = signal<CallHistoryItemDto | null>(null);
  isPanelOpen = signal(false);

  // Edit form (existing customer)
  editForm = this.fb.nonNullable.group({
    phoneNumber: ['', Validators.required],
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: ['', Validators.email],
    company: [''],
  });

  // Create form (new customer)
  createForm = this.fb.nonNullable.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    phoneNumber: ['', Validators.required],
    email: ['', Validators.email],
    company: [''],
  });

  private originalValues: unknown = null;

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.customerId.set(id);
      this.loadCustomer(id);
    } else {
      this.isNew.set(true);
    }

    this.editForm.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.isDirty.set(this.editForm.dirty);
    });
  }

  private loadCustomer(id: string) {
    this.isLoading.set(true);
    this.adminApi.getCustomerById(id).subscribe({
      next: (c) => {
        this.editForm.patchValue({
          phoneNumber: c.phoneNumber,
          firstName: c.firstName,
          lastName: c.lastName,
          email: c.email ?? '',
          company: c.company ?? '',
        });
        this.originalValues = this.editForm.getRawValue();
        this.isLoading.set(false);
        this.loadCallHistory(id);
      },
      error: () => {
        this.notification.showError('Kunde konnte nicht geladen werden.');
        this.router.navigate(['/admin/customers']);
      },
    });
  }

  private loadCallHistory(id: string) {
    this.isHistoryLoading.set(true);
    this.adminApi.getCustomerWithHistory(id).subscribe({
      next: (data) => {
        this.callHistory.set(data.recentCalls);
        this.isHistoryLoading.set(false);
      },
      error: () => {
        this.isHistoryLoading.set(false);
      },
    });
  }

  onCallClick(call: CallHistoryItemDto) {
    const current = this.selectedCall();
    if (current && current.id === call.id) {
      this.closePanel();
    } else {
      this.selectedCall.set(call);
      this.isPanelOpen.set(true);
    }
  }

  closePanel() {
    this.isPanelOpen.set(false);
    setTimeout(() => this.selectedCall.set(null), 350);
  }

  formatDuration(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')} min`;
  }

  getCategoryLabel(category: string): string {
    const labels: Record<string, string> = {
      TechnicalIssue: 'Technisches Problem',
      BillingQuestion: 'Abrechnung',
      AccessCredentials: 'Zugangsdaten',
      GeneralInquiry: 'Allgemeine Anfrage',
      Complaint: 'Beschwerde',
      FeatureRequest: 'Feature-Anfrage',
      Unknown: 'Unbekannt',
    };
    return labels[category] ?? 'Unbekannt';
  }

  getSummaryStatusLabel(status: string): string {
    const map: Record<string, string> = {
      Approved: 'Genehmigt',
      Draft: 'Entwurf',
      None: 'Kein Entwurf',
    };
    return map[status] ?? status ?? '—';
  }

  get pageTitle(): string {
    return this.isNew() ? 'Neuer Kunde' : 'Kunde bearbeiten';
  }

  isInvalid(form: 'edit' | 'create', field: string): boolean {
    const ctrl = form === 'edit' ? this.editForm.get(field) : this.createForm.get(field);
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
    if (this.createForm.invalid) {
      this.createForm.markAllAsTouched();
      return;
    }
    this.isSaving.set(true);
    const v = this.createForm.getRawValue();
    this.adminApi
      .createCustomer({
        firstName: v.firstName,
        lastName: v.lastName,
        phoneNumber: v.phoneNumber,
        email: v.email || undefined,
        company: v.company || undefined,
      })
      .subscribe({
        next: () => {
          this.notification.showSuccess('Kunde wurde erstellt.');
          this.router.navigate(['/admin/customers']);
        },
        error: () => {
          this.notification.showError('Erstellen fehlgeschlagen.');
          this.isSaving.set(false);
        },
      });
  }

  private saveEdit() {
    const id = this.customerId();
    if (!id || this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      return;
    }
    this.isSaving.set(true);
    const v = this.editForm.getRawValue();
    this.adminApi
      .updateCustomer(id, {
        phoneNumber: v.phoneNumber,
        firstName: v.firstName,
        lastName: v.lastName,
        email: v.email || undefined,
        company: v.company || undefined,
      })
      .subscribe({
        next: () => {
          this.notification.showSuccess('Kunde wurde gespeichert.');
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
      this.createForm.reset();
    } else if (this.originalValues) {
      this.editForm.patchValue(this.originalValues as never);
      this.editForm.markAsPristine();
      this.isDirty.set(false);
    }
  }

  deleteCustomer() {
    const id = this.customerId();
    if (!id) return;

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Kunde löschen',
        message:
          'Möchten Sie diesen Kunden wirklich löschen? Der Kunde wird als gelöscht markiert.',
        danger: true,
      },
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (!confirmed) return;
      this.isDeleting.set(true);
      this.adminApi.deleteCustomer(id).subscribe({
        next: () => {
          this.notification.showSuccess('Kunde wurde gelöscht.');
          this.router.navigate(['/admin/customers']);
        },
        error: () => {
          this.notification.showError('Löschen fehlgeschlagen.');
          this.isDeleting.set(false);
        },
      });
    });
  }

  goBack() {
    this.router.navigate(['/admin/customers']);
  }
}
