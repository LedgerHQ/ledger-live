import React from "react";
import { FeatureTour } from "../../components/FeatureTour";
import type { FeatureTourProps } from "../../components/FeatureTour/useFeatureTourViewModel";
import { CardScreenView } from "./CardScreenView.web";
import { useCardScreenViewModel } from "./useCardScreenViewModel";

export function CardScreen(props: FeatureTourProps = {}) {
  return (
    <>
      <CardScreenView {...useCardScreenViewModel()} />
      <FeatureTour {...props} />
    </>
  );
}
