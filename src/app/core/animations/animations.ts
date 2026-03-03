import { trigger, transition, style, animate, query, stagger } from '@angular/animations';

/**
 * Premium Animation Library
 * All animations use cubic-bezier(0.4, 0, 0.2, 1) for smooth, consistent motion
 */

export const fadeIn = trigger('fadeIn', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateY(20px)' }),
    animate(
      '400ms cubic-bezier(0.4, 0, 0.2, 1)',
      style({ opacity: 1, transform: 'translateY(0)' }),
    ),
  ]),
]);

export const slideIn = trigger('slideIn', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateY(30px)' }),
    animate(
      '400ms cubic-bezier(0.4, 0, 0.2, 1)',
      style({ opacity: 1, transform: 'translateY(0)' }),
    ),
  ]),
]);

export const slideUp = trigger('slideUp', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateY(40px)' }),
    animate(
      '500ms cubic-bezier(0.4, 0, 0.2, 1)',
      style({ opacity: 1, transform: 'translateY(0)' }),
    ),
  ]),
]);

export const fadeOut = trigger('fadeOut', [
  transition(':leave', [
    animate(
      '300ms cubic-bezier(0.4, 0, 0.2, 1)',
      style({ opacity: 0, transform: 'translateY(-20px)' }),
    ),
  ]),
]);

export const scaleIn = trigger('scaleIn', [
  transition(':enter', [
    style({ opacity: 0, transform: 'scale(0.8)' }),
    animate(
      '400ms cubic-bezier(0.175, 0.885, 0.32, 1.275)',
      style({ opacity: 1, transform: 'scale(1)' }),
    ),
  ]),
]);

export const successPulse = trigger('successPulse', [
  transition(':enter', [
    style({ transform: 'scale(0)', opacity: 0 }),
    animate(
      '400ms cubic-bezier(0.175, 0.885, 0.32, 1.275)',
      style({ transform: 'scale(1)', opacity: 1 }),
    ),
  ]),
]);

export const staggerIn = trigger('staggerIn', [
  transition('* => *', [
    query(
      ':enter',
      [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        stagger(100, [
          animate(
            '400ms cubic-bezier(0.4, 0, 0.2, 1)',
            style({ opacity: 1, transform: 'translateY(0)' }),
          ),
        ]),
      ],
      { optional: true },
    ),
  ]),
]);

export const glow = trigger('glow', [
  transition(':enter', [style({ opacity: 0.6 }), animate('2s ease-in-out', style({ opacity: 1 }))]),
]);

/**
 * Hover lift animation - Apply to interactive cards
 */
export const hoverLift = trigger('hoverLift', [
  transition('inactive => active', [
    animate('300ms cubic-bezier(0.4, 0, 0.2, 1)', style({ transform: 'translateY(-4px)' })),
  ]),
  transition('active => inactive', [
    animate('300ms cubic-bezier(0.4, 0, 0.2, 1)', style({ transform: 'translateY(0)' })),
  ]),
]);

/**
 * Route transition animation - Smooth page changes
 */
export const routeTransition = trigger('routeTransition', [
  transition('* <=> *', [
    query(
      ':enter, :leave',
      [
        style({
          position: 'absolute',
          width: '100%',
        }),
      ],
      { optional: true },
    ),
    query(':enter', [style({ opacity: 0, transform: 'translateX(20px)' })], { optional: true }),
    query(
      ':leave',
      [
        animate(
          '300ms cubic-bezier(0.4, 0, 0.2, 1)',
          style({ opacity: 0, transform: 'translateX(-20px)' }),
        ),
      ],
      { optional: true },
    ),
    query(
      ':enter',
      [
        animate(
          '400ms 100ms cubic-bezier(0.4, 0, 0.2, 1)',
          style({ opacity: 1, transform: 'translateX(0)' }),
        ),
      ],
      { optional: true },
    ),
  ]),
]);
