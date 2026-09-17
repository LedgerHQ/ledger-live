import type { ResolveWalletCounterValue } from "@features/flow-pay-card-wallets";

export type { ResolveWalletCounterValue };

export type CardAssetFormattedValue = Readonly<{
  integerPart: string;
  decimalPart?: string;
  currencyText: string;
  decimalSeparator: string;
  currencyPosition: "start" | "end";
}>;

export type FormatCardAssetCountervalue = (value: number) => CardAssetFormattedValue;

export type CardAssetsProps = Readonly<{
  formatCountervalue?: FormatCardAssetCountervalue;
  resolveCounterValue?: ResolveWalletCounterValue;
}>;

export type CardAssetRow = Readonly<{
  id: string;
  name: string;
  ticker: string;
  cryptoAmount: string | null;
  fiatAmount: string | null;
  ledgerId?: string;
}>;

export type CardAssetsStatus = "loading" | "error" | "empty" | "ready";

export type CardAssetsViewModel = Readonly<{
  isVisible: boolean;
  title: string;
  status: CardAssetsStatus;
  rows: readonly CardAssetRow[];
  emptyLabel: string;
  errorLabel: string;
}>;
