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

/**
 * The reward wallet with its currency attached, so a consumer prices it the way it prices a
 * linked wallet: no catalog lookup and no currency map of its own.
 */
export type CardRewardWalletBalance = Readonly<{
  id: string;
  /** The provider's own asset code, e.g. `usdc`. */
  currency: string;
  balance: string;
  isWithdrawable: boolean;
  /** The Ledger currency the asset resolves to, absent when it is not mapped. */
  ledgerId?: string;
  /** The resolved Ledger currency, absent until CAL answers. Pricing needs its units. */
  ledgerCurrency?: CryptoOrTokenCurrency;
}>;
