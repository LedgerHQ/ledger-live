import type { AccountAssetBalance } from "@domain/entity-account-balance";
import type { Currency } from "@domain/entity-currency";
import { calculate, type CounterValuesState } from "@domain/entity-market-countervalues";

export type AccountAssetRow = AccountAssetBalance & {
  /** In the fiat's smallest unit; absent without a rate. */
  value?: number;
  /** Change of the asset's rate over the last 24 hours, as a ratio. */
  trend?: number;
};

const DAY = 24 * 60 * 60 * 1000;

/** The balance entity's rows as the Account page shows them: the entity stays crypto only, the join is here. */
export function accountAssetRows(
  balances: readonly AccountAssetBalance[],
  countervalues: CounterValuesState,
  currencyOf: (assetId: string) => Currency | undefined,
  fiat: Currency | undefined,
  now = new Date(),
): AccountAssetRow[] {
  return balances.map(row => {
    const from = currencyOf(row.assetId);
    if (!from || !fiat) return row;
    const value = calculate(countervalues, { value: Number(row.balance), from, to: fiat });
    const rate = (date?: Date) =>
      calculate(countervalues, { value: 1, from, to: fiat, disableRounding: true, date });
    const today = rate();
    const dayAgo = rate(new Date(now.getTime() - DAY));
    return {
      ...row,
      ...(typeof value === "number" ? { value } : {}),
      ...(today && dayAgo ? { trend: today / dayAgo - 1 } : {}),
    };
  });
}
