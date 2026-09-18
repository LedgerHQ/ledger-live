import type { ReactNode } from "react";
import type { PayCardTransaction } from "@domain/api-card-management";
import type { CardTransactionFormatters } from "@features/flow-pay-card-transactions";
import type { CardVisualProps, FreezeViewModel, UnlockForReveal } from "../../../types";
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
  onShowMore?: () => void;
  formatters?: CardTransactionFormatters;
  unlock?: UnlockForReveal;
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

export type CardDetailsSceneProps = Readonly<{
  route: CardDetailsRoute;
  overview: OverviewSceneProps;
  freeze: FreezeSceneProps;
  more: MoreSceneProps | null;
  transaction: TransactionSceneProps | null;
}>;
