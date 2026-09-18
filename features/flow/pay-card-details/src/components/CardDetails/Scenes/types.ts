import type { ReactNode } from "react";
import type { PayCardTransaction } from "@domain/api-card-management";
import type { CardTransactionFormatters } from "@features/flow-pay-card-transactions";
import type { CardVisualProps, FreezeViewModel } from "../../../types";
import type { MoreViewModel, MoreViewProps } from "../../More/types";
import type { CardDetailsRoute } from "./navigation";

export type OverviewSceneProps = Readonly<{
  cardVisual?: CardVisualProps;
  assets?: ReactNode;
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

export type CardDetailsSceneProps = Readonly<{
  route: CardDetailsRoute;
  overview: OverviewSceneProps;
  freeze: FreezeSceneProps;
  more: MoreSceneProps | null;
  addToWallet: AddToWalletSceneProps;
  transaction: TransactionSceneProps | null;
}>;
