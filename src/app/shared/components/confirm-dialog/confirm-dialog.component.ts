import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  icon?: string;
  danger?: boolean;
}

@Component({
  selector: 'app-confirm-dialog',
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="confirm-dialog">
      <div class="dialog-icon" [class.danger]="data.danger !== false">
        <mat-icon>{{ data.icon || 'delete_outline' }}</mat-icon>
      </div>
      <h2 class="dialog-title">{{ data.title }}</h2>
      <p class="dialog-message">{{ data.message }}</p>
      <div class="dialog-actions">
        <button class="btn-cancel" (click)="dialogRef.close(false)">
          {{ data.cancelText || 'Abbrechen' }}
        </button>
        <button
          class="btn-confirm"
          [class.danger]="data.danger !== false"
          (click)="dialogRef.close(true)"
        >
          {{ data.confirmText || 'Löschen' }}
        </button>
      </div>
    </div>
  `,
  styles: [
    `
      .confirm-dialog {
        padding: 2rem 1.75rem 1.5rem;
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        max-width: 360px;
      }

      .dialog-icon {
        width: 56px;
        height: 56px;
        border-radius: 50%;
        background: #fef2f2;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 1.25rem;

        mat-icon {
          font-size: 1.75rem;
          width: 1.75rem;
          height: 1.75rem;
          color: #ef4444;
        }

        &:not(.danger) {
          background: #eff6ff;
          mat-icon {
            color: #3b82f6;
          }
        }
      }

      .dialog-title {
        font-size: 1.1rem;
        font-weight: 700;
        color: #0f172a;
        margin: 0 0 0.6rem;
        line-height: 1.3;
      }

      .dialog-message {
        font-size: 0.875rem;
        color: #64748b;
        margin: 0 0 1.75rem;
        line-height: 1.55;
      }

      .dialog-actions {
        display: flex;
        gap: 0.75rem;
        width: 100%;
        justify-content: center;
      }

      button {
        padding: 0.55rem 1.4rem;
        border-radius: 8px;
        font-size: 0.875rem;
        font-weight: 500;
        font-family: inherit;
        cursor: pointer;
        border: none;
        transition: all 0.15s;
        flex: 1;
        max-width: 140px;
      }

      .btn-cancel {
        background: #f1f5f9;
        color: #475569;
        &:hover {
          background: #e2e8f0;
        }
      }

      .btn-confirm {
        background: #ef4444;
        color: #fff;
        &:hover {
          background: #dc2626;
        }
        &:not(.danger) {
          background: #0891b2;
          &:hover {
            background: #155e75;
          }
        }
      }
    `,
  ],
})
export class ConfirmDialogComponent {
  readonly data = inject<ConfirmDialogData>(MAT_DIALOG_DATA);
  readonly dialogRef = inject(MatDialogRef<ConfirmDialogComponent>);
}
