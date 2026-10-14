import React from "react";
import { useBackupsButtonViewModel } from "./useBackupsButtonViewModel";
import { BackupsButtonView } from "./BackupsButtonView";

export function BackupsButton() {
  const viewModel = useBackupsButtonViewModel();

  return <BackupsButtonView {...viewModel} />;
}
