import React from "react";
import type { FearAndGreedAppearance, GaugeComponent } from "./types";
import { useFearAndGreedViewModel } from "./useFearAndGreedViewModel";
import { FearAndGreedView } from "./view";

type FearAndGreedProps = Readonly<{
  Gauge: GaugeComponent;
  appearance?: FearAndGreedAppearance;
  width?: number;
}>;

export function FearAndGreed({ appearance = "compact", width, Gauge }: FearAndGreedProps) {
  const viewModel = useFearAndGreedViewModel();
  return <FearAndGreedView {...viewModel} appearance={appearance} width={width} Gauge={Gauge} />;
}
