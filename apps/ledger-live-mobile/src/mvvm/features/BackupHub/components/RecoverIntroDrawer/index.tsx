import React from "react";
import { RecoverIntroDrawerView } from "./RecoverIntroDrawerView";
import { useRecoverIntroDrawerViewModel } from "./useRecoverIntroDrawerViewModel";

export function RecoverIntroDrawer() {
  const viewModel = useRecoverIntroDrawerViewModel();

  if (!viewModel) {
    return null;
  }

  return <RecoverIntroDrawerView {...viewModel} />;
}
