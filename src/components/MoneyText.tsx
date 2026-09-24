import { toUsdCents } from '@/domain/fx';
import { formatMoney } from '@/domain/money';
import type { Currency } from '@/domain/types';
import { cn } from '@/lib/cn';

/** Amount in its own currency, with the USD equivalent when it differs. */
export function MoneyText({
  cents,
  currency = 'USD',
  showUsd = true,
  className,
}: {
  cents: number;
  currency?: Currency;
  showUsd?: boolean;
  className?: string;
}) {
  return (
    <span className={cn('tnum', className)}>
      {formatMoney(cents, currency)}
      {showUsd && currency !== 'USD' ? (
        <span className="text-muted"> ({formatMoney(toUsdCents(cents, currency))})</span>
      ) : null}
    </span>
  );
}
