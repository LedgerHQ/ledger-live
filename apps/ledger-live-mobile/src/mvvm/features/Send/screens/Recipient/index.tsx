import React from "react";
import { RecipientScreenView } from "./RecipientScreenView";
import { useRecipientScreenViewModel } from "./hooks/useRecipientScreenViewModel";
import { SendFlowLayout } from "../../components/SendFlowLayout";

export function RecipientScreen() {
  const viewModel = useRecipientScreenViewModel();

  return (
    <SendFlowLayout>
      <RecipientScreenView {...viewModel} />
    </SendFlowLayout>
  );
}
