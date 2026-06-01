import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  OnInit,
  OnDestroy,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize, switchMap, tap, catchError, of, from } from 'rxjs';
import { CallApiService, CallRecord } from '../../services/call-api.service';
import { SignalRService } from '../../../../core/services/signalr.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { CallTimerComponent } from '../call-timer/call-timer.component';
import { AuthService } from '../../../../core/services/auth.service';
import { AudioCaptureService } from '../../../../core/services/audio-capture.service';
import { AgentDictationService } from '../../../../core/services/agent-dictation.service';
import { AdminApiService, CustomerWithHistoryDto } from '../../../admin/services/admin-api.service';

@Component({
  selector: 'app-call-view',
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatTooltipModule,
    ReactiveFormsModule,
    CallTimerComponent,
  ],
  templateUrl: './call-view.component.html',
  styleUrls: ['./call-view.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CallViewComponent implements OnInit, OnDestroy {
  route = inject(ActivatedRoute);
  router = inject(Router);
  fb = inject(FormBuilder);
  callApi = inject(CallApiService);
  signalR = inject(SignalRService);
  notification = inject(NotificationService);
  auth = inject(AuthService);
  audioCapture = inject(AudioCaptureService);
  dictation = inject(AgentDictationService);
  adminApi = inject(AdminApiService);
  private readonly destroyRef = inject(DestroyRef);

  call = signal<CallRecord | null>(null);
  isRecording = signal(true);
  isLoadingCall = signal(false);
  isProcessingManual = signal(false);
  isSubmitting = signal(false);
  transcript = signal<string>('');
  customerHistory = signal<CustomerWithHistoryDto | null>(null);
  customerPanelOpen = signal(true);

  approvalForm = this.fb.group({
    category: ['', Validators.required],
    summary: ['', [Validators.required, Validators.maxLength(1000)]],
  });

  ngOnInit() {
    this.route.queryParams.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const id = params['id'];
      if (id) {
        this.loadCall(id);
      } else {
        // No id param: try to find the agent's current active call
        const userId = this.auth.currentUser()?.id;
        if (userId) {
          this.isLoadingCall.set(true);
          this.callApi.getActiveCall(userId).subscribe({
            next: (activeCall) => {
              this.isLoadingCall.set(false);
              if (activeCall?.id) {
                this.router.navigate(['/calls'], {
                  queryParams: { id: activeCall.id },
                  replaceUrl: true,
                });
              }
            },
            error: () => this.isLoadingCall.set(false),
          });
        }
      }
    });

    // Listen for AI summary drafts
    this.signalR.summaryDraft$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((event) => {
      const currentCall = this.call();
      if (event?.callId?.toLowerCase() === currentCall?.id?.toLowerCase()) {
        this.isProcessingManual.set(false); // Reset manual processing state
        this.call.update((c) =>
          c
            ? {
                ...c,
                draftSummary: event.summary,
                category: event.category,
                actionItems: event.actionItems,
                summaryStatus: 'Draft',
              }
            : null,
        );

        this.approvalForm.patchValue({
          category: event.category,
          summary: event.summary,
        });

        this.notification.showInfo('KI hat einen Entwurf der Zusammenfassung erstellt.');
      }
    });

    // Listen for real-time transcripts
    this.signalR.transcriptUpdated$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((event) => {
      const currentCall = this.call();
      if (event?.callId.toLowerCase() === currentCall?.id.toLowerCase()) {
        this.transcript.update((current) => current + event.text + ' ');
      }
    });

    // Listen for transcription errors
    this.signalR.transcriptionError$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((event) => {
        const currentCall = this.call();
        if (event?.callId.toLowerCase() === currentCall?.id.toLowerCase()) {
          console.error('Transcription error:', event);
          this.notification.showError(`Transkriptionsfehler: ${event.error}`);
        }
      });
  }

  private loadCall(id: string) {
    this.callApi.getCallById(id).subscribe({
      next: (data) => {
        if (data?.id === id) {
          this.call.set(data);
          this.isRecording.set(!data.endTime);

          this.approvalForm.patchValue({
            category: data.category,
            summary: data.draftSummary || data.approvedSummary || '',
          });

          // Join the call's SignalR group
          this.signalR.subscribeToCall(id);

          // Load customer context if a customer is linked
          if (data.customerId) {
            this.loadCustomerContext(data.customerId);
          }

          // Auto-start microphone if call is active (not ended)
          if (!data.endTime && !this.audioCapture.isCaptureActive) {
            this.audioCapture
              .startCapture(data.id)
              .then(() => {
                this.notification.showSuccess('Mikrofon aktiviert - Transkription läuft');
              })
              .catch((err) => {
                console.error('Failed to start microphone:', err);
                this.notification.showError(
                  'Automatische Mikrofonerfassung konnte nicht gestartet werden.',
                );
              });
          }
        } else {
          this.notification.showError('Spezifischer Anruf nicht gefunden veya aktif değil.');
          this.router.navigate(['/dashboard']);
        }
      },
      error: () => {
        this.notification.showError('Fehler beim Laden der Anrufsession.');
        this.router.navigate(['/dashboard']);
      },
    });
  }

  openLinkCustomerDialog() {
    const currentCall = this.call();
    if (!currentCall) return;

    this.router.navigate(['/admin/customers/new'], {
      queryParams: {
        callerNumber: currentCall.callerNumber,
        callId: currentCall.id,
        returnUrl: this.router.url,
      },
    });
  }

  grantConsent() {
    this.recordConsent(true);
  }

  declineConsent() {
    this.recordConsent(false);
  }

  recordConsent(granted: boolean) {
    const activeCall = this.call();
    if (!activeCall) return;

    this.callApi.recordConsent(activeCall.id, granted).subscribe({
      next: () => {
        const status = granted ? 'Granted' : 'Declined';
        this.call.update((c) => (c ? { ...c, consent: status } : null));
        this.notification.showSuccess(`Einwilligung ${granted ? 'erteilt' : 'abgelehnt'}.`);

        if (granted) {
          this.notification.showInfo('KI-Analyse ist jetzt für diesen Anruf aktiv.');
        } else {
          this.notification.showWarning('KI-Analyse deaktiviert. Bitte manuell dokumentieren.');
        }
      },
    });
  }

  endCall() {
    const activeCall = this.call();

    if (!activeCall) {
      return;
    }

    // Check if consent needs to be recorded first (0=NotAsked, 1=Granted, 2=Declined)
    const consentValue = activeCall.consent;
    const isNotAsked = consentValue === 'NotAsked' || consentValue === 0 || consentValue === '0';

    // Create the consent recording observable (or empty observable if not needed)
    const consentObs$ = isNotAsked
      ? this.callApi.recordConsent(activeCall.id, true).pipe(
          tap(() => {
            this.call.update((c) => (c ? { ...c, consent: 'Granted' } : null));
          }),
          catchError((err) => {
            // If it's a 400 because consent was already granted, we can ignore it
            if (err.status === 400) {
              return of(null);
            }
            console.error('Failed to record consent:', err);
            return of(null);
          }),
        )
      : of(null).pipe(
          tap(() => {
            // Consent already recorded
          }),
        );

    // Chain: record consent → end call → navigate
    this.isRecording.set(false); // Set loading state

    // Stop audio capture FIRST, before finalizing transcription
    if (this.audioCapture.isCaptureActive) {
      this.audioCapture.stopCapture();
    }

    consentObs$
      .pipe(
        // Finalize Vosk transcription first to flush remaining text
        switchMap(() => {
          return from(this.signalR.finalizeCall(activeCall.id));
        }),
        // Then end the call on backend (may trigger AI summary)
        switchMap(() => {
          return this.callApi.endCall(activeCall.id, new Date());
        }),
        finalize(() => {
          // This runs whether success or error
          this.isRecording.set(false);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          // Response is void (no body), which is expected
          this.call.update((c) => (c ? { ...c, endTime: new Date() } : null));
          this.notification.showSuccess('Gespräch beendet. Warte auf KI-Zusammenfassung...');
        },
        error: (err) => {
          console.error('Failed to end call:', err);
          this.notification.showError('Fehler beim Beenden des Anrufs');
          this.isRecording.set(true); // Restore recording state on error
        },
      });
  }

  onApprove() {
    const activeCall = this.call();
    if (!activeCall || this.approvalForm.invalid) return;

    const { summary, category } = this.approvalForm.getRawValue();

    this.isSubmitting.set(true);
    this.callApi
      .approveSummary(
        activeCall.id,
        summary!,
        category!,
        activeCall.actionItems || [],
        this.auth.currentUser()?.id || '',
      )
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: () => {
          this.notification.showSuccess('Anrufdokumentation abgeschlossen.');
          this.router.navigate(['/dashboard']);
        },
      });
  }

  tidyUpManualNotes() {
    const activeCall = this.call();
    const manualNotes = this.approvalForm.get('summary')?.value;

    if (!activeCall || !manualNotes || manualNotes.length < 10) {
      this.notification.showWarning(
        'Bitte geben Sie mindestens 10 Zeichen ein, um sie zu optimieren.',
      );
      return;
    }

    this.isProcessingManual.set(true);
    this.callApi.tidyUpNotes(activeCall.id, manualNotes).subscribe({
      next: () => {
        this.notification.showInfo('KI optimiert Ihre Notizen...');
      },
      error: () => {
        this.notification.showError('KI-Optimierung fehlgeschlagen.');
        this.isProcessingManual.set(false);
      },
    });
  }

  startDictation() {
    const activeCall = this.call();
    if (!activeCall) return;

    this.dictation
      .startDictation()
      .then(() => {
        this.notification.showInfo('🎙️ Diktat gestartet – sprechen Sie jetzt...');
      })
      .catch((err) => {
        console.error('Dictation start error:', err);
        this.notification.showError('Mikrofonzugriff für Diktat verweigert.');
      });
  }

  stopDictationAndAppend() {
    const activeCall = this.call();
    if (!activeCall) return;

    this.dictation
      .stopDictationAndTranscribe(activeCall.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (text) => {
          const current = this.approvalForm.get('summary')?.value ?? '';
          const separator = current.trim().length > 0 ? ' ' : '';
          this.approvalForm.patchValue({ summary: current + separator + text });
          this.notification.showSuccess('Diktat hinzugefügt.');
        },
        error: (err) => {
          console.error('Dictation transcription error:', err);
          this.notification.showError('Diktat-Transkription fehlgeschlagen.');
        },
      });
  }

  cancelDictation() {
    this.dictation.cancelDictation();
    this.notification.showInfo('Diktat abgebrochen.');
  }

  isApprovable(): boolean {
    // Can approve if there is an AI draft OR if the user has typed something manually
    const hasDraft = !!this.call()?.draftSummary;
    const hasManualEntry = (this.approvalForm.get('summary')?.value?.length || 0) > 10;
    return hasDraft || hasManualEntry;
  }

  getStatusMessage(): string {
    const c = this.call();
    if (!this.isRecording() && !c?.draftSummary)
      return 'Warte auf finalen KI-Zusammenfassungsentwurf...';
    // Consent: 0=NotAsked, 1=Granted, 2=Declined
    if (c?.consent === 'NotAsked' || c?.consent === 0) return 'Warte auf Kundenzustimmung...';
    if (c?.consent === 'Declined' || c?.consent === 2)
      return 'Einwilligung abgelehnt. KI-Verarbeitung deaktiviert.';
    return 'Höre auf Gesprächsinhalte...';
  }

  private loadCustomerContext(customerId: string) {
    this.adminApi.getCustomerWithHistory(customerId).subscribe({
      next: (data) => this.customerHistory.set(data),
      error: () => {
        /* silently fail - customer context is optional */
      },
    });
  }

  toggleCustomerPanel() {
    this.customerPanelOpen.update((v) => !v);
  }

  getCategoryLabel(category: string): string {
    const map: Record<string, string> = {
      TechnicalIssue: 'Technisch',
      BillingQuestion: 'Abrechnung',
      AccessCredentials: 'Zugangsdaten',
      GeneralInquiry: 'Allgemein',
      Complaint: 'Beschwerde',
      FeatureRequest: 'Feature',
    };
    return map[category] ?? category ?? 'Unbekannt';
  }

  ngOnDestroy() {
    // Stop audio capture if active
    if (this.audioCapture.isCaptureActive) {
      this.audioCapture.stopCapture();
    }

    // Cancel any active dictation
    if (this.dictation.isDictating()) {
      this.dictation.cancelDictation();
    }
  }
}
