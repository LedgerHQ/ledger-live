import type { CardTransactionFormatters } from "@features/flow-pay-card-transactions";
import type { CardVisualProps, FreezeViewModel, UnlockForCardNumbers } from "../../../types";
import type { MoreViewModel, MoreViewProps } from "../../More/types";
import type { CardDetailsRoute } from "./navigation";

export type OverviewSceneProps = Readonly<{
  cardVisual?: CardVisualProps;
  freezeViewModel: FreezeViewModel;
  moreViewModel: MoreViewModel;
  onFreezePress: () => void;
  onMorePress: () => void;
  formatters?: CardTransactionFormatters;
  unlock?: UnlockForCardNumbers;
}>;

export type FreezeSceneProps = Readonly<{
  viewModel: FreezeViewModel;
}>;

export type MoreSceneProps = Readonly<{
  viewModel: MoreViewProps;
}>;

export type CardDetailsSceneProps = Readonly<{
  route: CardDetailsRoute;
  overview: OverviewSceneProps;
  freeze: FreezeSceneProps;
  more: MoreSceneProps | null;
}>;
