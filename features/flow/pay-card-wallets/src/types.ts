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
 * The card's cashback with its currency attached, so a consumer prices it the way it prices a
 * linked wallet: no catalog lookup and no currency map of its own.
 */
export type CardCashbackBalance = Readonly<{
  amount: string;
  /** The provider's own asset code, e.g. `BTC`, when it names one. */
  currency?: string | null;
  /** The provider's chain for that asset, e.g. `bitcoin`, when it names one. */
  network?: string | null;
  /** The rate the card earns cashback at, as a percentage, e.g. `1`. */
  ratePercent: string;
  /** The Ledger currency the asset resolves to, absent when it is not mapped. */
  ledgerId?: string;
  /** The resolved Ledger currency, absent until CAL answers. Pricing needs its units. */
  ledgerCurrency?: CryptoOrTokenCurrency;
}>;
