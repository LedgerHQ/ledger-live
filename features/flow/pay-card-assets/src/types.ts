export type CardAssetRow = Readonly<{
  id: string;
  ticker: string;
  cryptoAmount: string | null;
  ledgerId?: string;
}>;

export type CardAssetsStatus = "loading" | "error" | "empty" | "ready";

export type CardAssetsProps = Readonly<{
  onAddAsset?: () => void;
}>;

export type CardAssetsViewModel = Readonly<{
  isVisible: boolean;
  title: string;
  status: CardAssetsStatus;
  rows: readonly CardAssetRow[];
  emptyLabel: string;
  errorLabel: string;
  manageLabel: string;
  manageTitle: string;
  addAssetLabel: string;
  isManageOpen: boolean;
  onManagePress: () => void;
  onManageClose: () => void;
  onAddAsset?: () => void;
}>;
