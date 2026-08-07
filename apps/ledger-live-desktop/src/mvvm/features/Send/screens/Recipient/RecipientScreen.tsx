import React from "react";
import { RecipientScreenView } from "./components/RecipientScreenView";
import { useRecipientScreenViewModel } from "./hooks/useRecipientScreenViewModel";

export function RecipientScreen() {
  const viewModel = useRecipientScreenViewModel();

  // While scanning, the camera panel rendered by the header is the only body content
  if (!viewModel.ready) {
    return null;
  }

  return <RecipientScreenView viewModel={viewModel} />;
}
