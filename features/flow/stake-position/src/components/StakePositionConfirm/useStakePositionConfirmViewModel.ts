import { useStakePositionConfirmLabels } from "../../copy/useStakePositionLabels";
import type { StakePositionConfirmProps } from "./StakePositionConfirm.types";
import type { StakePositionConfirmViewProps } from "./StakePositionConfirmView.types";

export function useStakePositionConfirmViewModel({
  ticker,
  action,
  isPending,
  isConfirmDisabled,
  ...props
}: StakePositionConfirmProps): StakePositionConfirmViewProps {
  const labels = useStakePositionConfirmLabels(ticker, action);

  return { ...props, labels, isPending, isConfirmDisabled: isConfirmDisabled || isPending };
}
