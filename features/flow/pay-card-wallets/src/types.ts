export type ResolveWalletCounterValue = (
  wallet: Readonly<{ currency: string; network: string }>,
  balance: string,
) => number | null;

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
