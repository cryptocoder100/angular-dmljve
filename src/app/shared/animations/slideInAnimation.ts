import { trigger, transition, query, group, animate, style, state } from '@angular/animations';

export const slideInAnimation = trigger('slideInAnimation',
[
  transition('* <=> *',
    [
      // events to apply
      // define style and animaiton to apply
      // config object with optional set to true to handle when elment not yet added to DOM
      query(':enter, :leave', style({position: 'fixed', width: '100%', zIndex: 2}), {optional: true}),
      group([
        query(':enter', [
          style({ transform: 'translateX(100%)' }),
          animate('0.5s ease-out', style({ transform: 'translateX(0%)'}))
        ], {optional: true}),
        query(':leave', [
          style({ transform: 'translateX(0%)'}),
          animate('0.5s ease-out', style({ transform: 'translateX(-100%)'}))
        ], {optional: true})
      ])
    ]
  )
]);



