import React from "react";
import { RecipientScreenContainer } from "./components/RecipientScreenContainer";
import { useRecipientScreenViewModel } from "./hooks/useRecipientScreenViewModel";

export function RecipientScreen() {
  const viewModel = useRecipientScreenViewModel();

  if (!viewModel.ready) {
    return null;
  }

  return <RecipientScreenContainer screenViewModel={viewModel} />;
}
