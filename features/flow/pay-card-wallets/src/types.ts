/**
 * Values one wallet's balance, keyed on the Ledger id its asset resolves to. Answers in the
 * counter-value currency's smallest unit — cents for euros, not euros.
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
  /** Summed in the same smallest unit. */
  total: number;
  isPartialTotal: boolean;
}>;
