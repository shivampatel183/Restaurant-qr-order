import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

import { OrderStatus } from '../models/domain.models';

@Component({
  selector: 'app-order-status-badge',
  standalone: true,
  imports: [CommonModule],
  template: ` <span [ngClass]="status">{{ status }}</span> `,
  styles: [
    `
      span {
        text-transform: capitalize;
        border-radius: 999px;
        padding: 0.25rem 0.6rem;
        font-size: 0.8rem;
        font-weight: 700;
      }
      .pending { background: #fef3c7; color: #92400e; }
      .preparing { background: #dbeafe; color: #1d4ed8; }
      .served { background: #dcfce7; color: #166534; }
      .paid { background: #e9d5ff; color: #6b21a8; }
    `
  ]
})
export class OrderStatusBadgeComponent {
  @Input({ required: true }) status!: OrderStatus;
}
