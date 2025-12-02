import type { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";

export type Asset = {
  id: string;
  name: string;
  ticker: string;
  currency: CryptoCurrency | TokenCurrency;
};

export type AssetSelectionStep = "asset" | "network" | "account";

export type AssetSelectionState = {
  currentStep: AssetSelectionStep;
  selectedAsset?: Asset;
  selectedNetwork?: string;
  selectedAccount?: string;
};
