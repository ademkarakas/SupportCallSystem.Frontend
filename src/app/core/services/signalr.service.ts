import { Injectable, signal } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { Subject, BehaviorSubject } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface IncomingCallEvent {
  callId: string;
  callerNumber: string;
  timestamp: Date;
  customer: any | null;
}

export interface SummaryDraftEvent {
  callId: string;
  summary: string;
  category: string;
  actionItems: string[];
}

export interface TranscriptUpdatedEvent {
  callId: string;
  text: string;
  timestamp: Date;
}

export interface TranscriptionErrorEvent {
  callId: string;
  error: string;
  details: string;
}

@Injectable({
  providedIn: 'root',
})
export class SignalRService {
  private hubConnection!: signalR.HubConnection;

  public connectionStatus = signal<
    'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error'
  >('disconnected');

  readonly incomingCallSubject = new BehaviorSubject<IncomingCallEvent | null>(null);
  public incomingCall$ = this.incomingCallSubject.asObservable();

  readonly summaryDraftSubject = new Subject<SummaryDraftEvent>();
  public summaryDraft$ = this.summaryDraftSubject.asObservable();

  readonly transcriptUpdatedSubject = new Subject<TranscriptUpdatedEvent>();
  public transcriptUpdated$ = this.transcriptUpdatedSubject.asObservable();

  readonly transcriptionErrorSubject = new Subject<TranscriptionErrorEvent>();
  public transcriptionError$ = this.transcriptionErrorSubject.asObservable();

  constructor() {}

  public async startConnection(token: string): Promise<void> {
    if (this.hubConnection?.state === signalR.HubConnectionState.Connected) {
      return;
    }

    this.connectionStatus.set('connecting');

    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(`${environment.apiUrl}/hubs/call`, {
        accessTokenFactory: () => token,
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000])
      .configureLogging(signalR.LogLevel.Information)
      .build();

    this.registerOnServerEvents();

    this.hubConnection.onreconnecting(() => {
      this.connectionStatus.set('reconnecting');
    });
    this.hubConnection.onreconnected(() => {
      this.connectionStatus.set('connected');
    });
    this.hubConnection.onclose(() => {
      this.connectionStatus.set('disconnected');
    });

    try {
      await this.hubConnection.start();
      this.connectionStatus.set('connected');
      console.log('SignalR Connected');
    } catch (err) {
      this.connectionStatus.set('error');
      console.error('Error while starting connection: ' + err);
      setTimeout(() => this.startConnection(token), 5000);
    }
  }

  private registerOnServerEvents(): void {
    this.hubConnection.on('IncomingCall', (data: IncomingCallEvent) => {
      console.log('SignalR IncomingCall received:', data);
      this.incomingCallSubject.next(data);
    });

    this.hubConnection.on('SummaryDraftReady', (data: SummaryDraftEvent) => {
      console.log('SignalR SummaryDraftReady received:', data);
      this.summaryDraftSubject.next(data);
    });

    this.hubConnection.on('TranscriptUpdated', (data: TranscriptUpdatedEvent) => {
      console.log('SignalR TranscriptUpdated received:', data);
      this.transcriptUpdatedSubject.next(data);
    });

    this.hubConnection.on('TranscriptionError', (data: TranscriptionErrorEvent) => {
      console.error('SignalR TranscriptionError received:', data);
      this.transcriptionErrorSubject.next(data);
    });
  }

  public async subscribeToCall(callId: string): Promise<void> {
    if (this.hubConnection?.state === signalR.HubConnectionState.Connected) {
      await this.hubConnection.invoke('SubscribeToCall', callId);
    }
  }

  public async registerAgent(extension: string): Promise<void> {
    if (this.hubConnection?.state === signalR.HubConnectionState.Connected) {
      try {
        await this.hubConnection.invoke('RegisterAgent', extension);
        console.log(`Registered agent extension: ${extension}`);
      } catch (err) {
        console.error(`Failed to register agent: ${err}`);
      }
    }
  }

  public async streamAudio(callId: string, audioChunk: ArrayBuffer): Promise<void> {
    if (this.hubConnection?.state === signalR.HubConnectionState.Connected) {
      try {
        const uint8Array = new Uint8Array(audioChunk);
        await this.hubConnection.invoke('StreamAudio', callId, Array.from(uint8Array));
      } catch (err) {
        console.error(`Failed to stream audio: ${err}`);
      }
    }
  }

  public async stopConnection(): Promise<void> {
    if (this.hubConnection) {
      await this.hubConnection.stop();
    }
  }
}
