import type { CryptoOrTokenCurrency } from "@domain/entity-currency";

export type CardAssetRow = Readonly<{
  id: string;
  /** The currency's own name, e.g. "USD Coin". The provider's asset code when nothing maps it. */
  name: string;
  ticker: string;
  /** What `CryptoIcon` needs to find the glyph. Empty for a wallet no Ledger currency maps. */
  ledgerId: string;
  cryptoAmount: string;
  /** In the counter-value currency. `null` when nothing could price the wallet. */
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
