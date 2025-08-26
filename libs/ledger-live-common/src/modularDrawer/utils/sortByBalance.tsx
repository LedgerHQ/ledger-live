import { BalanceUI } from "./type";

export const parseFiatValue = (value?: string, discreet?: boolean) => {
  if (!value || discreet) return -1;
  return parseFloat(value.replace(/[^0-9.-]+/g, "")) || -1;
};

export function toFiatString(x?: BalanceUI): string | undefined {
  return x && "fiatValue" in x ? String(x.fiatValue) : undefined;
}

export function hasBalance(x?: BalanceUI): boolean {
  return !!x && (("fiatValue" in x && !!x.fiatValue) || ("balance" in x && !!x.balance));
}

export function compareByHasThenFiat(
  a: BalanceUI | undefined,
  b: BalanceUI | undefined,
  discreet: boolean,
): number {
  const ah = hasBalance(a);
  const bh = hasBalance(b);
  if (ah && !bh) return -1;
  if (!ah && bh) return 1;
  const af = parseFiatValue(toFiatString(a), discreet);
  const bf = parseFiatValue(toFiatString(b), discreet);
  return bf - af;
}
