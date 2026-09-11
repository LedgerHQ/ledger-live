export type CardAssetRow = Readonly<{
  id: string;
  cryptoAmount: string;
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
