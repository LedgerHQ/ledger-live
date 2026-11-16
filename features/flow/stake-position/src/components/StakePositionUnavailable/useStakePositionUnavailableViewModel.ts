import { useStakePositionUnavailableLabels } from "../../copy/useStakePositionLabels";
import type { StakePositionUnavailableProps } from "./StakePositionUnavailable.types";
import type { StakePositionUnavailableViewProps } from "./StakePositionUnavailableView.types";

export function useStakePositionUnavailableViewModel({
  reason,
  onDismiss,
  testID,
}: StakePositionUnavailableProps): StakePositionUnavailableViewProps {
  const labels = useStakePositionUnavailableLabels();

  if (reason === "loading") return { reason, text: labels.loading, testID };
  return {
    reason,
    title: labels.notFoundTitle,
    description: labels.notFoundDescription,
    closeLabel: labels.close,
    onDismiss,
    testID,
  };
}
