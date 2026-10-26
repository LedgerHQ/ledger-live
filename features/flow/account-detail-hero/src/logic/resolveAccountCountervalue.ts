import { sumAssetValues } from "@features/platform-quick-actions";

type Balance = Readonly<{ isZero: () => boolean }>;

type Countervalue = Readonly<{ toNumber: () => number }>;

type ValuedAsset<TCurrency, TBalance extends Balance> = Readonly<{
  currency: TCurrency;
  account: Readonly<{ balance: TBalance }>;
}>;

export type CalculateCountervalue<TCurrency, TBalance extends Balance> = (
  currency: TCurrency,
  balance: TBalance,
) => Countervalue | null | undefined;

export function resolveAccountCountervalue<TCurrency, TBalance extends Balance>(
  assets: readonly ValuedAsset<TCurrency, TBalance>[],
  calculateCountervalue: CalculateCountervalue<TCurrency, TBalance>,
): number | undefined {
  return sumAssetValues(
    assets,
    ({ account }) => !account.balance.isZero(),
    ({ currency, account }) => calculateCountervalue(currency, account.balance)?.toNumber(),
  );
}
