import type { Currency, EntityId } from '@/domain/types';

export const COMPANY = {
  name: 'Northwind Outdoor Co.',
  industry: 'Outdoor gear maker and retailer',
  employees: 420,
  monthlyRevenueCents: 800_000_000,
  monthlyCostsCents: 760_000_000,
  cashOnHandCents: 640_000_000,
  lastCloseDays: 9,
  targetCloseDays: 3,
  period: 'September 2026',
  businessDay: 2,
} as const;

export interface Entity {
  id: EntityId;
  name: string;
  currency: Currency;
  parent: boolean;
}

export const ENTITIES: Entity[] = [
  { id: 'US', name: 'Northwind Outdoor Inc.', currency: 'USD', parent: true },
  { id: 'CA', name: 'Northwind Outdoor Canada Ltd.', currency: 'CAD', parent: false },
  { id: 'UK', name: 'Northwind Outdoor UK Ltd.', currency: 'GBP', parent: false },
];

export const PEOPLE = {
  user: { name: 'Maya Chen', title: 'Controller', firstName: 'Maya' },
  cfo: { name: 'Arjun Mehta', title: 'CFO' },
  developer: { name: 'Sam Okafor', title: 'Founder', company: 'Rebatewise' },
} as const;

export const USER_ACTOR = 'Maya Chen, Controller';
