import type { ReactNode } from "react";
import type { StakePositionExitAction } from "../../types";

export type StakePositionConfirmProps = Readonly<{
  action: StakePositionExitAction;
  ticker: string;
  /**
   * The chain snapshot figure of the prepared transaction (`getExitAmount`), formatted with its
   * ticker. The details show the backend figures instead.
   */
  amount: string;
  /** The validator as `getStakePositionValidatorName` names it. */
  validatorName: string;
  /** The name of the account the funds go back to. Defaults to the ticker. */
  accountName?: string;
  /** The transaction error, as the app renders it. */
  errorContent?: ReactNode;
  /** The transaction is still being prepared: the confirmation waits for it. */
  isPending: boolean;
  isConfirmDisabled: boolean;
  onConfirm: () => void;
  testID?: string;
}>;
