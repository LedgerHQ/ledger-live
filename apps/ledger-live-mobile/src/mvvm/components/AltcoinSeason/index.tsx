import React from "react";
import { useAltcoinSeasonViewModel } from "./useAltcoinSeasonViewModel";
import { AltcoinSeasonView } from "./AltcoinSeasonView";
import type { AltcoinSeasonProps } from "./types";

export function AltcoinSeason({ width }: AltcoinSeasonProps) {
  const viewModel = useAltcoinSeasonViewModel();
  return <AltcoinSeasonView {...viewModel} width={width} />;
}
