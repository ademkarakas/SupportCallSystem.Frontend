import { Component, inject, signal, computed, OnInit, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { interval } from 'rxjs';
import { AdminApiService, ActiveCallDto, UserDto } from '../../services/admin-api.service';
import { SignalRService } from '../../../../core/services/signalr.service';

export type AgentStatus = 'available' | 'busy' | 'away';

export interface AgentStatusRow {
  userId: string;
  name: string;
  email: string;
  extension: string;
  status: AgentStatus;
  activeCallId: string | null;
  activeCallSince: Date | null;
  elapsedLabel: string | null;
}

export interface QueuedCall {
  callId: string;
  callerNumber: string;
  customerName: string | null;
  arrivedAt: Date;
}

@Component({
  selector: 'app-live-dashboard',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, MatTooltipModule],
  templateUrl: './live-dashboard.component.html',
  styleUrls: ['./live-dashboard.component.scss'],
})
export class LiveDashboardComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly api = inject(AdminApiService);
  private readonly signalR = inject(SignalRService);
  private readonly router = inject(Router);

  isLoading = signal(true);
  lastRefreshed = signal<Date | null>(null);

  /** Active calls fetched from backend */
  activeCalls = signal<ActiveCallDto[]>([]);

  /** All agents (from users API) */
  private readonly allAgents = signal<UserDto[]>([]);

  /** Incoming calls not yet accepted — built from SignalR queue events */
  callQueue = signal<QueuedCall[]>([]);

  /** Per-agent live timer (elapsed seconds), updated every second */
  private readonly timerTick = signal(0);

  /** Derived agent status rows */
  readonly agentRows = computed<AgentStatusRow[]>(() => {
    this.timerTick(); // trigger recompute on timer tick
    const calls = this.activeCalls();
    const agents = this.allAgents();
    const now = Date.now();
    const busyMap = new Map(calls.map((c) => [c.agentUserId, c]));

    return agents.map((agent) => {
      const activeCall = busyMap.get(agent.id);
      return {
        userId: agent.id,
        name: `${agent.firstName} ${agent.lastName}`,
        email: agent.email,
        extension: agent.extension ?? '',
        status: activeCall ? 'busy' : 'available',
        activeCallId: activeCall?.id ?? null,
        activeCallSince: activeCall ? new Date(activeCall.startTime) : null,
        elapsedLabel: activeCall
          ? this.formatElapsedMs(now - new Date(activeCall.startTime).getTime())
          : null,
      };
    });
  });

  readonly busyCount = computed(() => this.agentRows().filter((r) => r.status === 'busy').length);
  readonly availableCount = computed(
    () => this.agentRows().filter((r) => r.status === 'available').length,
  );

  /** Active calls enriched with a pre-computed elapsed label (avoids NG0100) */
  readonly activeCallRows = computed(() => {
    this.timerTick();
    const now = Date.now();
    return this.activeCalls().map((call) => ({
      ...call,
      elapsedLabel: this.formatElapsedMs(now - new Date(call.startTime).getTime()),
    }));
  });

  /** Queue items enriched with a pre-computed wait label (avoids NG0100) */
  readonly callQueueRows = computed(() => {
    this.timerTick();
    const now = Date.now();
    return this.callQueue().map((q) => ({
      ...q,
      waitLabel: this.formatElapsedMs(now - q.arrivedAt.getTime()),
    }));
  });

  ngOnInit(): void {
    this.loadData();

    // Auto-refresh every 30 seconds
    interval(30_000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.loadData());

    // Live timer tick every second
    interval(1_000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.timerTick.update((t) => t + 1));

    // SignalR: new call started → add to active calls
    this.signalR.callStarted$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((event) => {
      const newCall: ActiveCallDto = {
        id: event.callId,
        callerNumber: event.callerNumber,
        customerName: event.customerName,
        customerId: null,
        agentUserId: event.agentUserId,
        startTime: new Date(event.startTime).toISOString(),
        elapsedSeconds: 0,
      };
      this.activeCalls.update((list) => [...list.filter((c) => c.id !== event.callId), newCall]);
      // Remove from queue when a call is accepted
      this.callQueue.update((q) => q.filter((qc) => qc.callId !== event.callId));
    });

    // SignalR: call ended → remove from active calls
    this.signalR.callEnded$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((event) => {
      this.activeCalls.update((list) => list.filter((c) => c.id !== event.callId));
    });

    // SignalR: new incoming call → add to queue
    this.signalR.incomingCall$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((event) => {
      if (!event) return;
      const alreadyQueued = this.callQueue().some((q) => q.callId === event.callId);
      if (!alreadyQueued) {
        this.callQueue.update((q) => [
          ...q,
          {
            callId: event.callId,
            callerNumber: event.callerNumber,
            customerName: event.customer
              ? `${event.customer.firstName} ${event.customer.lastName}`.trim()
              : null,
            arrivedAt: new Date(),
          },
        ]);
      }
    });
  }

  loadData(): void {
    this.isLoading.set(true);
    let callsDone = false;
    let agentsDone = false;
    const tryFinish = () => {
      if (callsDone && agentsDone) {
        this.isLoading.set(false);
        this.lastRefreshed.set(new Date());
      }
    };

    this.api.getActiveCalls().subscribe({
      next: (calls) => {
        this.activeCalls.set(calls);
        callsDone = true;
        tryFinish();
      },
      error: () => {
        callsDone = true;
        tryFinish();
      },
    });

    this.api.getAllUsers().subscribe({
      next: (users) => {
        this.allAgents.set(users);
        agentsDone = true;
        tryFinish();
      },
      error: () => {
        agentsDone = true;
        tryFinish();
      },
    });
  }

  navigateToCall(callId: string): void {
    this.router.navigate(['/calls'], { queryParams: { id: callId } });
  }

  dismissQueue(callId: string, event: MouseEvent): void {
    event.stopPropagation();
    this.callQueue.update((q) => q.filter((qc) => qc.callId !== callId));
  }

  private formatElapsedMs(ms: number): string {
    const secs = Math.max(0, Math.floor(ms / 1000));
    if (secs < 60) return `${secs}s`;
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins}m ${remainder}s`;
  }

  statusLabel(status: AgentStatus): string {
    return status === 'busy' ? 'Im Gespräch' : 'Verfügbar';
  }

  agentDisplayName(agentUserId: string): string {
    const agent = this.allAgents().find((a) => a.id === agentUserId);
    return agent ? `${agent.firstName} ${agent.lastName}`.trim() : agentUserId;
  }
}
