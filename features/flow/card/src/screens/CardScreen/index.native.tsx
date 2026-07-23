import React from "react";
import { FeatureTour } from "../../components/FeatureTour/index.native";
import type { FeatureTourProps } from "../../components/FeatureTour/useFeatureTourViewModel";
import { CardScreenView } from "./CardScreenView.native";
import { useCardScreenViewModel } from "./useCardScreenViewModel";

export function CardScreen(props: FeatureTourProps = {}) {
  return (
    <>
      <CardScreenView {...useCardScreenViewModel()} />
      <FeatureTour {...props} />
    </>
  );
}
