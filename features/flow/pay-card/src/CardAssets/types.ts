import type { CryptoOrTokenCurrency } from "@domain/entity-currency";

type CardWalletIdentity = Readonly<{
  id: string;
  /** The currency's own name, e.g. "USD Coin". The provider's asset code when nothing maps it. */
  name: string;
  ticker: string;
  /** What `CryptoIcon` needs to find the glyph. Empty for a wallet no Ledger currency maps. */
  ledgerId: string;
  cryptoAmount: string;
}>;

export type PricedCardWallet = CardWalletIdentity &
  Readonly<{
    /** In the counter-value currency's smallest unit. `null` when nothing could price the wallet. */
    countervalue: number | null;
  }>;

export type CardAssetRow = CardWalletIdentity &
  Readonly<{
    /** Formatted for display. `null` when nothing could price the wallet. */
    countervalue: string | null;
  }>;

export type CardAssetsStatus = "loading" | "error" | "empty" | "ready";

export type CardAssetsProps = Readonly<{
  currencies: ReadonlyMap<string, CryptoOrTokenCurrency>;
  /** Prices one wallet. The rates are the app's, so the host owns this. */
  priceWallet: (currency: CryptoOrTokenCurrency, balance: string) => number | null;
  formatCountervalue: (value: number) => string;
}>;

export type CardAssetsViewModel = Readonly<{
  isVisible: boolean;
  title: string;
  status: CardAssetsStatus;
  rows: readonly CardAssetRow[];
  emptyLabel: string;
  errorLabel: string;
}>;
