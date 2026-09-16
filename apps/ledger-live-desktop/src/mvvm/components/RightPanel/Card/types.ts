import type { CardFormatters, CardProps as PayCardProps } from "@features/flow-pay-card";
import type { CardNumbersUnlockDialogState } from "./useUnlockForCardNumbers";

export interface CardViewModel {
  readonly formatters: Required<CardFormatters>;
  readonly assets: PayCardProps["assets"];
  readonly login: PayCardProps["login"];
  readonly unlock: NonNullable<PayCardProps["unlock"]>;
  readonly unlockDialog: CardNumbersUnlockDialogState;
  readonly onShowMore: () => void;
}
