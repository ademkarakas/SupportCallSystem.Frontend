import { Component, inject } from '@angular/core';
import { Location } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../core/services/auth.service';
import { fadeIn, scaleIn } from '../../core/animations/animations';

@Component({
  selector: 'app-not-found',
  imports: [RouterModule, MatIconModule],
  templateUrl: './not-found.component.html',
  styleUrls: ['./not-found.component.scss'],
  animations: [fadeIn, scaleIn],
})
export class NotFoundComponent {
  private readonly location = inject(Location);
  protected readonly isAuthenticated = inject(AuthService).isAuthenticated;

  goBack(): void {
    this.location.back();
  }
}
