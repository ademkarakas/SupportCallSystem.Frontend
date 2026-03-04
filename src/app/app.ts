import { Component, OnInit, inject, effect } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { SignalRService } from './core/services/signalr.service';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  template: `<router-outlet></router-outlet>`,
})
export class App implements OnInit {
  auth = inject(AuthService);
  signalR = inject(SignalRService);
  router = inject(Router);

  constructor() {
    // Re-connect SignalR if token changes/appears
    effect(() => {
      const token = this.auth.getToken();
      if (token) {
        this.signalR.startConnection(token);
      }
    });

    // Register agent extension when connected
    effect(() => {
      const status = this.signalR.connectionStatus();
      const user = this.auth.currentUser();

      if (status === 'connected') {
        // Use user extension or default '1001' for testing
        const extension = user?.extension || '1001';
        this.signalR.registerAgent(extension);
      }
    });
  }

  ngOnInit() {
    // Initial check
    const token = this.auth.getToken();
    if (token) {
      this.signalR.startConnection(token);
    }
  }
}
