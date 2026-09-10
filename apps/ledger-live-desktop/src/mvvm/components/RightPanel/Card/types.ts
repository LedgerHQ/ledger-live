import type { CardFormatters, CardProps as PayCardProps } from "@features/flow-pay-card";
import type { UnlockForCardNumbers } from "@features/flow-pay-card-details";
import type { CardNumbersUnlockDialogState } from "./useUnlockForCardNumbers";

export interface CardViewModel {
  readonly title: string;
  readonly formatters: Required<CardFormatters>;
  readonly balanceLabel: string;
  readonly login: PayCardProps["login"];
  readonly unlock: UnlockForCardNumbers;
  readonly unlockDialog: CardNumbersUnlockDialogState;
}
