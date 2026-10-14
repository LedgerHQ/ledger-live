import React from "react";
import type { FearAndGreedAppearance, GaugeComponent } from "./types";
import { useFearAndGreedViewModel } from "./useFearAndGreedViewModel";
import { FearAndGreedView } from "./view";

type FearAndGreedProps = {
  Gauge: GaugeComponent;
  appearance?: FearAndGreedAppearance;
};

export function FearAndGreed({ Gauge, appearance }: FearAndGreedProps) {
  const viewModel = useFearAndGreedViewModel();
  return <FearAndGreedView {...viewModel} Gauge={Gauge} appearance={appearance} />;
}
