import type { CardLinkedWalletBalance } from "@features/flow-pay-card-wallets";
import type { CryptoOrTokenCurrency } from "@domain/entity-currency";

export type SelectCardWalletsTotalParams = Readonly<{
  wallets: readonly CardLinkedWalletBalance[];
  getCounterValue:
    | ((currency: CryptoOrTokenCurrency, balance: string) => number | null)
    | undefined;
}>;

export function selectCardWalletsTotal({
  wallets,
  getCounterValue,
}: SelectCardWalletsTotalParams): number {
  if (getCounterValue === undefined) return 0;

  return wallets.reduce((sum, { balance, ledgerCurrency }) => {
    if (!ledgerCurrency || balance === null) return sum;

    return sum + (getCounterValue(ledgerCurrency, balance) ?? 0);
  }, 0);
}
