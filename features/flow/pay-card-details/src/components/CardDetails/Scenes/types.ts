import type { PayCardTransaction } from "@domain/api-card-management";
import type {
  CardAssetDialogCopy,
  CardAssetRow,
  CardAssetsListProps,
  CardAssetsProps,
  CardAssetsViewModel,
} from "@features/flow-pay-card-assets";
import type {
  CardTransactionFormatters,
  CardTransactionItem,
} from "@features/flow-pay-card-transactions";
import type { CardVisualProps, FreezeViewModel } from "../../../types";
import type { MoreViewModel, MoreViewProps } from "../../More/types";
import type { CardDetailsRoute } from "./navigation";

export type OverviewSceneProps = Readonly<{
  cardVisual?: CardVisualProps;
  assetsViewModel: CardAssetsListProps | null;
  /** The host's pricing, which the reward banner needs for a counter-value. */
  assets?: CardAssetsProps;
  freezeViewModel: FreezeViewModel;
  moreViewModel: MoreViewModel;
  onFreezePress: () => void;
  onMorePress: () => void;
  onTransactionPress: (transaction: PayCardTransaction) => void;
  onAddToWalletPress: () => void;
  onShowMore?: () => void;
  onViewRewards?: () => void;
  formatters?: CardTransactionFormatters;
  disclaimer: string;
}>;

export type FreezeSceneProps = Readonly<{
  viewModel: FreezeViewModel;
}>;

export type MoreSceneProps = Readonly<{
  viewModel: MoreViewProps;
}>;

export type TransactionSceneProps = Readonly<{
  transaction: PayCardTransaction;
  formatters?: CardTransactionFormatters;
}>;

export type AddToWalletSceneProps = Readonly<{
  onDone: () => void;
}>;

export type AssetDetailsSceneProps = Readonly<{
  asset: CardAssetRow;
  transactions: readonly CardTransactionItem[];
  copy: CardAssetDialogCopy;
  formatBalance?: CardAssetsViewModel["formatBalance"];
  formatters?: CardTransactionFormatters;
  onTopUp: () => void;
  onWithdraw: () => void;
  onShowHistory: () => void;
  onTransactionPress: (transaction: CardTransactionItem) => void;
}>;

export type AssetWithdrawSceneProps = Readonly<{
  copy: CardAssetDialogCopy;
  onContinue: () => void;
}>;

export type AssetsManageSceneProps = Readonly<{
  viewModel: CardAssetsViewModel;
}>;

export type AssetTransactionSceneProps = Readonly<{
  transaction: CardTransactionItem;
  formatters?: CardTransactionFormatters;
}>;

/** What the sheet chrome shows between the back and close buttons for the current scene. */
export type CardDetailsSceneHeader = Readonly<{
  title?: string;
  description?: string;
}>;

export type CardDetailsSceneProps = Readonly<{
  route: CardDetailsRoute;
  header: CardDetailsSceneHeader;
  overview: OverviewSceneProps;
  freeze: FreezeSceneProps;
  more: MoreSceneProps | null;
  addToWallet: AddToWalletSceneProps;
  transaction: TransactionSceneProps | null;
  assetDetails: AssetDetailsSceneProps | null;
  assetWithdraw: AssetWithdrawSceneProps | null;
  assetsManage: AssetsManageSceneProps | null;
  assetTransaction: AssetTransactionSceneProps | null;
}>;
