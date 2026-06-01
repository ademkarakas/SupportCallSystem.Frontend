import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { switchMap, timer, retry, catchError, of, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class DebugService {
  readonly http = inject(HttpClient);
  readonly auth = inject(AuthService);

  simulateIncomingCall(phoneNumber: string = '+4915101234568', injectMockTranscript = false) {
    const user = this.auth.currentUser();
    const extension = user?.extension || '1001';

    const callId = `fake-call-${Date.now()}`;
    const payload = {
      callId: callId,
      callerNumber: phoneNumber,
      calledNumber: '+493012345678',
      timestamp: new Date().toISOString(),
      extension: extension,
    };

    // Sample transcript for AI summary generation
    const sampleTranscript = `Agent: Guten Tag, Service Hotline. Mein Name ist Markus. Wie kann ich Ihnen helfen?
Kunde: Hallo Markus, ich habe ein Problem mit meiner Internetverbindung. Sie ist seit heute Morgen sehr langsam.
Agent: Das tut mir leid zu hören. Lassen Sie mich das für Sie überprüfen. Können Sie mir bitte Ihre Kundennummer geben?
Kunde: Ja, die ist K-12345678.
Agent: Vielen Dank. Einen Moment bitte... Ich sehe hier in unserem System, dass es in Ihrer Region tatsächlich eine technische Störung gibt. Unser Technik-Team arbeitet bereits daran.
Kunde: Oh, okay. Wann wird das Problem voraussichtlich behoben sein?
Agent: Die Störung sollte bis heute Abend um 18 Uhr behoben sein. Ich trage Sie in unsere Benachrichtigungsliste ein, sodass Sie eine SMS erhalten, sobald alles wieder funktioniert.
Kunde: Das klingt gut. Bekomme ich eine Gutschrift für die Ausfallzeit?
Agent: Ja, natürlich. Wir werden die Ausfallzeit automatisch berechnen und Ihnen auf Ihrer nächsten Rechnung gutschreiben. Das sind etwa 8 Stunden.
Kunde: Perfekt! Vielen Dank für Ihre Hilfe.
Agent: Gern geschehen! Gibt es noch etwas, womit ich Ihnen helfen kann?
Kunde: Nein, das war alles. Auf Wiederhören!
Agent: Auf Wiederhören und einen schönen Tag noch!`;

    // Use proper RxJS chaining: webhook → wait → populate-transcript
    return this.http.post(`${environment.apiUrl}/api/webhooks/nfon/incoming-call`, payload).pipe(
      switchMap(() => {
        console.log('✅ Webhook call created successfully:', callId);
        if (!injectMockTranscript) {
          console.log('🎤 Real microphone mode — skipping mock transcript injection');
          return of(null);
        }
        // Wait 2500ms to give the user time to click "Accept"
        return timer(2500).pipe(
          switchMap(() => {
            console.log('📝 Populating mock transcript for call:', callId);
            return this.http
              .post(`${environment.apiUrl}/api/test/populate-transcript`, {
                callId: callId,
                transcript: sampleTranscript,
              })
              .pipe(
                retry({ count: 5, delay: 1000 }), // Retry up to 5 times with 1s delay if it fails
                catchError((err) => {
                  console.warn(
                    '⚠️ Failed to populate transcript (may be production or timing issue):',
                    err,
                  );
                  // Don't fail the whole operation if transcript population fails
                  return of(null);
                }),
              );
          }),
        );
      }),
      tap(() => console.log('✅ Incoming call simulation completed:', callId)),
      catchError((err) => {
        console.error('❌ Failed to simulate incoming call:', err);
        throw err;
      }),
    );
  }

  simulateAiSummary(callId: string) {
    const user = this.auth.currentUser();
    if (!user) return;

    const payload = {
      callId: callId,
      summary:
        'Customer called regarding a technical issue with their login. Verified identity and guided through password reset process. Customer confirmed successful login.',
      category: 'TechnicalIssue',
      actionItems: ['Send follow-up email with security tips', 'Check logs for recurrence'],
      agentId: user.id,
    };

    return this.http.post(`${environment.apiUrl}/api/test/trigger-summary-ready`, payload);
  }
}
