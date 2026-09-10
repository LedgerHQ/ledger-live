import type { CardProps as PayCardProps } from "@features/flow-pay-card";
import type { FormattedValue, UnlockForCardNumbers } from "@features/flow-pay-card-details";
import type { CardNumbersUnlockDialogState } from "./useUnlockForCardNumbers";

export interface CardViewModel {
  readonly title: string;
  readonly formatCountervalue: (value: number) => FormattedValue;
  readonly formatTransactionAmount: NonNullable<PayCardProps["formatTransactionAmount"]>;
  readonly balanceLabel: string;
  readonly login: PayCardProps["login"];
  readonly unlock: UnlockForCardNumbers;
  readonly unlockDialog: CardNumbersUnlockDialogState;
}
