import type { ReactNode } from "react";
import type { StakePositionConfirmLabels } from "../../copy/useStakePositionLabels";

export type StakePositionConfirmViewProps = Readonly<{
  labels: StakePositionConfirmLabels;
  errorContent?: ReactNode;
  isPending: boolean;
  isConfirmDisabled: boolean;
  onConfirm: () => void;
  testID?: string;
}>;
