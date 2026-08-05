import React from "react";
import { PerpsReviewView } from "./PerpsReviewView";
import { usePerpsReviewViewModel, type PerpsReviewProps } from "./usePerpsReviewViewModel";

export type { PerpsReviewParams, PerpsReviewProps } from "./usePerpsReviewViewModel";

export function PerpsReview(props: PerpsReviewProps) {
  const viewModel = usePerpsReviewViewModel(props);
  return <PerpsReviewView {...viewModel} />;
}
