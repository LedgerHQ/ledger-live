import type { PayCardTransaction } from "@domain/api-card-management";
import type { CardAssetsViewModel } from "@features/flow-pay-card-assets";
import type { CardTransactionFormatters } from "@features/flow-pay-card-transactions";
import type { CardVisualProps, FreezeViewModel } from "../../../types";
import type { MoreViewModel, MoreViewProps } from "../../More/types";
import type { CardDetailsRoute } from "./navigation";

export type OverviewSceneProps = Readonly<{
  cardVisual?: CardVisualProps;
  assetsViewModel: CardAssetsViewModel | null;
  freezeViewModel: FreezeViewModel;
  moreViewModel: MoreViewModel;
  onFreezePress: () => void;
  onMorePress: () => void;
  onTransactionPress: (transaction: PayCardTransaction) => void;
  onAddToWalletPress: () => void;
  onShowMore?: () => void;
  formatters?: CardTransactionFormatters;
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
  viewModel: CardAssetsViewModel;
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
  assetWithdraw: CardAssetsViewModel | null;
}>;
