import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { CallApiService, CallRecord } from '../../services/call-api.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { fadeIn } from '../../../../core/animations/animations';

@Component({
  selector: 'app-call-detail',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, RouterLink],
  templateUrl: './call-detail.component.html',
  styleUrls: ['./call-detail.component.scss'],
  animations: [fadeIn],
})
export class CallDetailComponent implements OnInit {
  route = inject(ActivatedRoute);
  router = inject(Router);
  callApi = inject(CallApiService);
  notification = inject(NotificationService);

  call = signal<CallRecord | null>(null);
  isLoading = signal(true);
  callId = signal<string | null>(null);

  ngOnInit() {
    this.route.queryParams.subscribe((params) => {
      const id = params['id'];
      if (id) {
        this.callId.set(id);
        this.loadCall(id);
      } else {
        this.notification.showError('Keine Anruf-ID angegeben.');
        this.router.navigate(['/dashboard']);
      }
    });
  }

  private loadCall(id: string) {
    this.isLoading.set(true);
    this.callApi.getCallById(id).subscribe({
      next: (data) => {
        if (data) {
          this.call.set(data);
        } else {
          this.notification.showError('Anruf nicht gefunden.');
          this.router.navigate(['/dashboard']);
        }
        this.isLoading.set(false);
      },
      error: () => {
        this.notification.showError('Fehler beim Laden der Anrufdetails.');
        this.isLoading.set(false);
        this.router.navigate(['/dashboard']);
      },
    });
  }

  goBack() {
    this.router.navigate(['/dashboard']);
  }

  openInCallView() {
    this.router.navigate(['/calls/view'], { queryParams: { id: this.callId() } });
  }

  getConsentLabel(consent: number | string): string {
    switch (consent) {
      case 1:
      case 'Granted':
        return 'Erteilt';
      case 2:
      case 'Declined':
        return 'Abgelehnt';
      default:
        return 'Nicht gefragt';
    }
  }

  getConsentClass(consent: number | string): string {
    switch (consent) {
      case 1:
      case 'Granted':
        return 'badge-active';
      case 2:
      case 'Declined':
        return 'badge-inactive';
      default:
        return 'badge-neutral';
    }
  }

  getSummaryStatusLabel(status: string): string {
    switch (status) {
      case 'Approved':
        return 'Genehmigt';
      case 'Draft':
        return 'Entwurf';
      default:
        return status || 'Ausstehend';
    }
  }

  getSummaryStatusClass(status: string): string {
    switch (status) {
      case 'Approved':
        return 'badge-active';
      case 'Draft':
        return 'badge-neutral';
      default:
        return 'badge-inactive';
    }
  }

  formatDuration(seconds: number): string {
    if (!seconds) return '—';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  }
}
