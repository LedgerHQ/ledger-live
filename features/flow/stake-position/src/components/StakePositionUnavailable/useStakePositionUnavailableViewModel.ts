import { useStakePositionUnavailableLabels } from "../../copy/useStakePositionLabels";
import type { StakePositionUnavailableProps } from "./StakePositionUnavailable.types";
import type { StakePositionUnavailableViewProps } from "./StakePositionUnavailableView.types";

export function useStakePositionUnavailableViewModel({
  reason,
  onDismiss,
  onRetry,
  testID,
}: StakePositionUnavailableProps): StakePositionUnavailableViewProps {
  const labels = useStakePositionUnavailableLabels();

  if (reason === "loading") return { reason, text: labels.loading, testID };
  if (reason === "notFound") {
    return {
      reason,
      title: labels.notFoundTitle,
      description: labels.notFoundDescription,
      closeLabel: labels.close,
      onDismiss,
      testID,
    };
  }
  return {
    reason,
    title: labels.errorTitle,
    description: labels.errorDescription,
    retry: onRetry && { label: labels.retry, onRetry },
    closeLabel: labels.close,
    onDismiss,
    testID,
  };
}
