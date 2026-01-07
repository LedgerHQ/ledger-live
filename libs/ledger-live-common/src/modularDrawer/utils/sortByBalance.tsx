import { BalanceUI } from "./type";

export function hasBalance(balanceData?: BalanceUI): boolean {
  return !!balanceData && balanceData.balance !== undefined && balanceData.balance.gt(0);
}

export function compareByBalanceThenFiat(
  a: BalanceUI | undefined,
  b: BalanceUI | undefined,
): number {
  const ah = hasBalance(a);
  const bh = hasBalance(b);
  if (ah && !bh) return -1;
  if (!ah && bh) return 1;

  const aFiat = a?.fiatValue ?? 0;
  const bFiat = b?.fiatValue ?? 0;
  return bFiat - aFiat;
}
