/**
 * Values one wallet's balance in the user's counter-value currency.
 *
 * Keyed on the Ledger currency the wallet's asset resolves to, not on the provider's own ticker: a
 * ticker does not say which chain's token it is, and the rates are keyed by Ledger id. A wallet
 * whose asset the catalog does not cover has no `ledgerId` and is never passed here.
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
  counterValue: number | null;
}>;

export type CardLinkedWallets = Readonly<{
  wallets: readonly CardLinkedWalletBalance[];
  total: number;
  isPartialTotal: boolean;
}>;
