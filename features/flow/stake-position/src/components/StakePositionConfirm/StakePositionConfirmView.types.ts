import type { ReactNode } from "react";
import type { StakePositionConfirmLabels } from "../../copy/useStakePositionLabels";
import type { StakePositionAmount } from "../../types";

export type StakePositionConfirmViewProps = Readonly<{
  labels: StakePositionConfirmLabels;
  amount: StakePositionAmount;
  validatorName: string;
  fees?: string;
  errorContent?: ReactNode;
  isPending: boolean;
  isConfirmDisabled: boolean;
  onConfirm: () => void;
  testID?: string;
}>;
