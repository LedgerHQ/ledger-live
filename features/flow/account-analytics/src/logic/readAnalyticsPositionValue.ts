import { calculate, type CounterValuesCacheView } from "@domain/entity-market-countervalues";
import type { Currency } from "@domain/entity-currency";
import type { AccountLike } from "@ledgerhq/types-live";
import { getAccountCurrency } from "@ledgerhq/ledger-wallet-framework/account";

/** A held position without a usable price reads `null`, so no caller can sum a partial total. */
export function readAnalyticsPositionValue(
  position: AccountLike,
  countervalues: CounterValuesCacheView,
  fiat: Currency,
): number | null {
  if (position.balance.isZero()) return 0;
  const value = calculate(countervalues, {
    from: getAccountCurrency(position),
    to: fiat,
    value: position.balance.toNumber(),
  });
  return value != null && Number.isFinite(value) ? value : null;
}
