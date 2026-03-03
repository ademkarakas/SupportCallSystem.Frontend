import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { IncomingCallEvent } from '../../../../core/services/signalr.service';
import { slideUp, fadeIn } from '../../../../core/animations/animations';

@Component({
  selector: 'app-customer-popup',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  templateUrl: './customer-popup.component.html',
  styleUrls: ['./customer-popup.component.scss'],
  animations: [slideUp, fadeIn],
})
export class CustomerPopupComponent {
  constructor(
    public dialogRef: MatDialogRef<CustomerPopupComponent>,
    @Inject(MAT_DIALOG_DATA) public data: IncomingCallEvent,
  ) {}

  onAccept(): void {
    console.log('CustomerPopup: Accept button clicked');
    this.dialogRef.close({ action: 'accept' });
  }

  onReject(): void {
    this.dialogRef.close({ action: 'reject' });
  }
}
