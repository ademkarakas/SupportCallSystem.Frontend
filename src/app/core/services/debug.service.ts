import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { switchMap, timer, retry, catchError, of, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class DebugService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);

  simulateIncomingCall(phoneNumber: string = '+4915123456789') {
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
    const sampleTranscript = `Agent: Hello, thank you for calling customer support. This is Marcus speaking. How can I assist you today?
Customer: Hi Marcus, I'm calling because I can't log into my account. It keeps saying my password is incorrect, but I'm sure it's right.
Agent: I'm sorry to hear you're having trouble. I'd be happy to help you regain access. Let me verify your identity first. Could you please provide the email address associated with your account?
Customer: It's john.smith@email.com.
Agent: Thank you, John. Let me look that up... I found your account. I see the last login was three days ago. Before we reset your password, could you answer a security question? What was the name of your first pet?
Customer: It was Fluffy, a golden retriever.
Agent: Perfect, that matches our records. Now, let's reset your password. I'm sending a password reset link to your email. You should receive it in the next minute.
Customer: Got it! I received the email.
Agent: Great! Click on the link, and you'll be taken to a page where you can create a new password. Make sure it's at least 12 characters with a mix of uppercase, lowercase, numbers, and special characters.
Customer: Okay, I'm doing that now... All set! I've created a new password.
Agent: Excellent! Try logging in with your new password and let me know if it works.
Customer: Yes, it worked! I'm logged in now. Thank you so much for your help!
Agent: You're very welcome! Is there anything else I can help you with today?
Customer: No, that was everything. Thanks again!
Agent: My pleasure. Thank you for contacting us, and have a great day!`;

    console.log('🔔 Simulating incoming call:', { callId, phoneNumber, extension });

    // Use proper RxJS chaining: webhook → wait → populate-transcript
    return this.http.post(`${environment.apiUrl}/api/webhooks/nfon/incoming-call`, payload).pipe(
      switchMap(() => {
        console.log('✅ Webhook call created successfully:', callId);
        // Wait 2500ms to give the user time to click "Accept"
        return timer(2500).pipe(
          switchMap(() => {
            console.log('📝 Populating transcript for call:', callId);
            return this.http.post(`${environment.apiUrl}/api/test/populate-transcript`, {
              callId: callId,
              transcript: sampleTranscript
            }).pipe(
              retry({ count: 5, delay: 1000 }), // Retry up to 5 times with 1s delay if it fails
              catchError((err) => {
                console.warn('⚠️ Failed to populate transcript (may be production or timing issue):', err);
                // Don't fail the whole operation if transcript population fails
                return of(null);
              })
            );
          })
        );
      }),
      tap(() => console.log('✅ Incoming call simulation completed:', callId)),
      catchError((err) => {
        console.error('❌ Failed to simulate incoming call:', err);
        throw err;
      })
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
