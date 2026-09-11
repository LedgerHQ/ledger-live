/**
 * Values one wallet's balance in the user's counter-value currency.
 *
 * Keyed on the Ledger currency the wallet's asset resolves to, not on the provider's own ticker: a
 * ticker does not say which chain's token it is, and the rates are keyed by Ledger id. A wallet
 * whose asset the catalog does not cover has no `ledgerId` and is never passed here.
 *
 * The answer is in the counter-value currency's smallest unit — cents for euros, not euros — which
 * is what `formatCurrencyUnit(counterValueCurrency.units[0], …)` and `CurrencyUnitValue` take. Read
 * as a plain number it is a hundred times too large.
 */
export type ResolveWalletCounterValue = (ledgerId: string, balance: string) => number | null;

export type CardLinkedWalletBalance = Readonly<{
  id: string;
  address: string;
  currency: string;
  network: string;
  priority: number;
  /** The Ledger currency the wallet's asset resolves to, absent when it is not mapped. */
  ledgerId?: string;
  balance: string | null;
  /** In the counter-value currency's smallest unit. `null` when nothing could price it. */
  counterValue: number | null;
}>;

export type CardLinkedWallets = Readonly<{
  wallets: readonly CardLinkedWalletBalance[];
  /** The wallets summed, in the same smallest unit each `counterValue` is in. */
  total: number;
  isPartialTotal: boolean;
}>;
