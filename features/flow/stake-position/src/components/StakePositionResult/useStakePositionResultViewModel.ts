import { useStakePositionResultLabels } from "../../copy/useStakePositionLabels";
import type { StakePositionResultProps } from "./StakePositionResult.types";
import type { StakePositionResultViewProps } from "./StakePositionResultView.types";

export function useStakePositionResultViewModel(
  props: StakePositionResultProps,
): StakePositionResultViewProps {
  const labels = useStakePositionResultLabels(
    props.outcome === "success"
      ? { outcome: "success", action: props.action, ticker: props.ticker }
      : { outcome: "failure" },
  );

  if (props.outcome === "success") {
    const { onViewTransaction } = props;
    return {
      preset: "success",
      title: labels.title,
      description: labels.description,
      cta: onViewTransaction && { label: labels.cta, onPress: onViewTransaction },
      testID: props.testID,
    };
  }

  return {
    preset: "error",
    title: labels.title,
    description: props.errorDescription,
    warning: props.isSigned ? labels.broadcastError : undefined,
    cta: { label: labels.cta, onPress: props.onRetry },
    testID: props.testID,
  };
}
