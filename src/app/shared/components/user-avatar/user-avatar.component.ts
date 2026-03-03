import { Component, Input, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * UserAvatarComponent
 *
 * Displays a circular avatar with user initials.
 * Automatically extracts first and last name initials.
 * Supports multiple sizes and custom colors.
 */
@Component({
  selector: 'app-user-avatar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="avatar"
      [class]="'avatar-' + size()"
      [style.background-color]="backgroundColor()"
      [style.color]="textColor()"
      [attr.aria-label]="ariaLabel()"
    >
      <ng-container *ngIf="!imageUrl(); else imageTemplate">
        {{ initials() }}
      </ng-container>
      <ng-template #imageTemplate>
        <img [src]="imageUrl()" [alt]="ariaLabel()" (error)="onImageError()" />
      </ng-template>
    </div>
  `,
  styles: [
    `
      .avatar {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border-radius: var(--radius-full);
        font-weight: var(--font-weight-semibold);
        overflow: hidden;
        flex-shrink: 0;
        user-select: none;
        text-transform: uppercase;

        &.avatar-sm {
          width: 24px;
          height: 24px;
          font-size: 10px;
        }

        &.avatar-md {
          width: 32px;
          height: 32px;
          font-size: 12px;
        }

        &.avatar-lg {
          width: 40px;
          height: 40px;
          font-size: 14px;
        }

        &.avatar-xl {
          width: 48px;
          height: 48px;
          font-size: 16px;
        }

        &.avatar-2xl {
          width: 64px;
          height: 64px;
          font-size: 20px;
        }

        img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
      }
    `,
  ],
})
export class UserAvatarComponent {
  /** First name of the user */
  @Input() firstName: string = '';

  /** Last name of the user */
  @Input() lastName: string = '';

  /** Optional image URL (if provided, shows image instead of initials) */
  @Input() imageUrl = signal<string | null>(null);

  /** Size variant */
  @Input() size = signal<'sm' | 'md' | 'lg' | 'xl' | '2xl'>('md');

  /** Custom background color (defaults to primary theme color) */
  @Input() backgroundColor = signal<string>('var(--color-primary)');

  /** Custom text color (defaults to button primary text color) */
  @Input() textColor = signal<string>('var(--color-button-primary-text)');

  /** Computed initials from first and last name */
  initials = computed(() => {
    const first = this.firstName?.trim()?.[0] || '';
    const last = this.lastName?.trim()?.[0] || '';
    const result = (first + last).toUpperCase();
    return result || '?';
  });

  /** Aria label for accessibility */
  ariaLabel = computed(() => {
    if (this.firstName || this.lastName) {
      return `${this.firstName} ${this.lastName}`.trim();
    }
    return 'User avatar';
  });

  /** Handle image load error - fallback to initials */
  onImageError(): void {
    this.imageUrl.set(null);
  }
}
