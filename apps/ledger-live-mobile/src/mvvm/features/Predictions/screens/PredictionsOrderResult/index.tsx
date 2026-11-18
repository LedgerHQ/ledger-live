import React from "react";
import { PredictionsOrderResultLayout } from "@features/flow-predictions/native";
import { StatusGradient } from "LLM/components/StatusGradient";
import type { PredictionsOrderResultViewModel } from "./usePredictionsOrderResultViewModel";

export function PredictionsOrderResultView({
  result,
  tone,
  handleClose,
  handleRetry,
}: PredictionsOrderResultViewModel) {
  return (
    <PredictionsOrderResultLayout
      background={<StatusGradient tone={tone} testID="predictions-order-result-gradient" />}
      result={result && { report: result.report, onClose: handleClose, onRetry: handleRetry }}
    />
  );
}
