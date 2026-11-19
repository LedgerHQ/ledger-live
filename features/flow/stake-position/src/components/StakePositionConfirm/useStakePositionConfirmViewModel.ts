import { useStakePositionConfirmLabels } from "../../copy/useStakePositionLabels";
import type { StakePositionConfirmProps } from "./StakePositionConfirm.types";
import type { StakePositionConfirmViewProps } from "./StakePositionConfirmView.types";

export function useStakePositionConfirmViewModel({
  action,
  ticker,
  amount,
  validatorName,
  accountName,
  errorContent,
  isPending,
  isConfirmDisabled,
  onConfirm,
  testID,
}: StakePositionConfirmProps): StakePositionConfirmViewProps {
  const labels = useStakePositionConfirmLabels(ticker, action, {
    amount,
    validator: validatorName,
    account: accountName ?? ticker,
  });

  return {
    labels,
    errorContent,
    isPending,
    isConfirmDisabled: isConfirmDisabled || isPending,
    onConfirm,
    testID,
  };
}
