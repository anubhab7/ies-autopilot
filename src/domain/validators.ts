import { isScopeId } from './scopes';

export type PricingModel = 'per_outcome' | 'monthly' | 'free';

export const PRICING_MODEL_LABELS: Record<PricingModel, string> = {
  per_outcome: 'Per outcome',
  monthly: 'Monthly subscription',
  free: 'Free',
};

export const PRICE_MIN_CENTS = 1;
export const PRICE_MAX_CENTS = 1_000_000;

export interface ListingInput {
  name: string;
  description: string;
  pricingModel: string;
  price: string;
  scopes: string[];
}

export type ListingErrors = Partial<Record<keyof ListingInput, string>>;

/** Parses a price like "12.50" into cents; null when not a valid non-negative amount. */
export function parsePriceCents(text: string): number | null {
  const trimmed = text.trim();
  if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) return null;
  const [whole, fraction = ''] = trimmed.split('.');
  return Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
}

export function isPricingModel(value: string): value is PricingModel {
  return value === 'per_outcome' || value === 'monthly' || value === 'free';
}

export function validateListing(input: ListingInput, existingNames: string[]): ListingErrors {
  const errors: ListingErrors = {};

  const name = input.name.trim();
  if (name.length < 3 || name.length > 60) {
    errors.name = 'Name must be 3 to 60 characters.';
  } else if (existingNames.some((n) => n.trim().toLowerCase() === name.toLowerCase())) {
    errors.name = 'An agent with this name is already in the store. Choose a different name.';
  }

  const description = input.description.trim();
  if (description.length < 20 || description.length > 500) {
    errors.description = `Description must be 20 to 500 characters (now ${description.length}).`;
  }

  if (!isPricingModel(input.pricingModel)) {
    errors.pricingModel = 'Choose per outcome, monthly subscription, or free.';
  } else {
    const cents = parsePriceCents(input.price);
    if (input.pricingModel === 'free') {
      if (cents !== 0) errors.price = 'Free agents must have a price of $0.';
    } else if (cents === null) {
      errors.price = 'Enter a price like 12.50 with at most 2 decimals and no minus sign.';
    } else if (cents < PRICE_MIN_CENTS || cents > PRICE_MAX_CENTS) {
      errors.price = 'Price must be between $0.01 and $10,000.00.';
    }
  }

  if (input.scopes.length === 0) {
    errors.scopes = 'Select at least one data scope.';
  } else if (input.scopes.some((s) => !isScopeId(s))) {
    errors.scopes = 'Agents can only draft entries. Remove unsupported scopes such as posting entries.';
  }

  return errors;
}

export function isListingValid(input: ListingInput, existingNames: string[]): boolean {
  return Object.keys(validateListing(input, existingNames)).length === 0;
}
