import type { CryptoOrTokenCurrency } from "@domain/entity-currency";

export type CardLinkedWalletBalance = Readonly<{
  id: string;
  /** Provider address identifier required by card wallet mutation endpoints. */
  addressId?: string;
  address: string;
  currency: string;
  network: string;
  priority: number;
  /** The Ledger currency the wallet's asset resolves to, absent when it is not mapped. */
  ledgerId?: string;
  /** The resolved Ledger currency, absent until CAL answers. Pricing needs its units. */
  ledgerCurrency?: CryptoOrTokenCurrency;
  balance: string | null;
}>;

export type CardLinkedWallets = Readonly<{
  wallets: readonly CardLinkedWalletBalance[];
}>;
