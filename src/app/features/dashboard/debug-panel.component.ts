import { Component, inject, signal, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { DebugService } from '../../core/services/debug.service';
import { ActivatedRoute } from '@angular/router';
import { first } from 'rxjs';

@Component({
  selector: 'app-debug-panel',
  imports: [CommonModule, MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule],
  templateUrl: './debug-panel.component.html',
  styleUrls: ['./debug-panel.component.scss'],
})
export class DebugPanelComponent {
  debugSvc = inject(DebugService);
  route = inject(ActivatedRoute);

  isVisible = signal(false);
  externalControl = input(signal(false));
  isLoading = signal(false);

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
