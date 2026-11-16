import type { ReactNode } from "react";
import type { StakePositionAmount, StakePositionExitAction } from "../../types";

export type StakePositionConfirmProps = Readonly<{
  ticker: string;
  action: StakePositionExitAction;
  amount: StakePositionAmount;
  validatorName: string;
  /** Formatted network fees. The row is hidden when missing. */
  fees?: string;
  /** The transaction error, as the app renders it. */
  errorContent?: ReactNode;
  /** The transaction is still being prepared: the confirmation waits for it. */
  isPending: boolean;
  isConfirmDisabled: boolean;
  onConfirm: () => void;
  testID?: string;
}>;
