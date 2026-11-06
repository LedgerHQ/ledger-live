import React from "react";
import { PNL_SECTION_TEST_IDS } from "./testIds";
import { PnlSectionView } from "./PnlSectionView";
import { usePnlSectionViewModel } from "./usePnlSectionViewModel";

export { PNL_SECTION_TEST_IDS };

export default function PnlSection() {
  const { shouldDisplayPnl, ...viewModel } = usePnlSectionViewModel();
  if (!shouldDisplayPnl) return null;
  return <PnlSectionView {...viewModel} />;
}
