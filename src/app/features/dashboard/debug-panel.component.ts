import { Component, inject, signal, input, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { DebugService } from '../../core/services/debug.service';
import { ActivatedRoute } from '@angular/router';
import { first } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-debug-panel',
  imports: [CommonModule, MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule],
  templateUrl: './debug-panel.component.html',
  styleUrls: ['./debug-panel.component.scss'],
})
export class DebugPanelComponent implements OnInit {
  debugSvc = inject(DebugService);
  route = inject(ActivatedRoute);
  http = inject(HttpClient);

  isVisible = signal(false);
  externalControl = input(signal(false));
  isLoading = signal(false);

  nfonStatus = signal<'disconnected' | 'authenticating' | 'connected' | 'error' | 'unconfigured'>(
    'unconfigured',
  );

  nfonConnected = computed(() => this.nfonStatus() === 'connected');

  nfonStatusLabel = computed(() => {
    switch (this.nfonStatus()) {
      case 'connected':
        return 'NFON verbunden';
      case 'authenticating':
        return 'Authentifizierung läuft...';
      case 'error':
        return 'NFON Fehler';
      case 'disconnected':
        return 'NFON nicht verbunden';
      default:
        return 'NFON nicht konfiguriert';
    }
  });

  nfonStatusIcon = computed(() => {
    switch (this.nfonStatus()) {
      case 'connected':
        return 'check_circle';
      case 'authenticating':
        return 'sync';
      case 'error':
        return 'error';
      default:
        return 'power_off';
    }
  });

  nfonStatusClass = computed(() => {
    switch (this.nfonStatus()) {
      case 'connected':
        return 'status-connected';
      case 'authenticating':
        return 'status-pending';
      case 'error':
        return 'status-error';
      default:
        return 'status-disconnected';
    }
  });

  ngOnInit() {
    this.loadNfonStatus();
  }

  private loadNfonStatus() {
    this.http
      .get<{ configured: boolean; status: string }>(`${environment.apiUrl}/api/nfon/status`)
      .subscribe({
        next: (res) => {
          if (!res.configured) {
            this.nfonStatus.set('unconfigured');
          } else {
            this.nfonStatus.set(res.status as any);
          }
        },
        error: () => this.nfonStatus.set('disconnected'),
      });
  }

  activeCallId(): string | null {
    return window.location.search.includes('id=')
      ? window.location.search.split('id=')[1].split('&')[0]
      : null;
  }

  triggerCall() {
    this.runSimulation(false);
  }

  triggerCallWithMockData() {
    this.runSimulation(true);
  }

  private runSimulation(injectMockTranscript: boolean) {
    const request = this.debugSvc.simulateIncomingCall('+4915101234567', injectMockTranscript);

    if (!request) {
      return;
    }

    this.isLoading.set(true);
    request.pipe(first()).subscribe({
      next: () => {
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Simulation failed:', err);
        this.isLoading.set(false);
      },
      complete: () => {
        this.isLoading.set(false);
      },
    });
  }

  triggerSummary() {
    const id = this.activeCallId();
    if (id) {
      this.debugSvc.simulateAiSummary(id)?.pipe(first()).subscribe();
    }
  }
}
