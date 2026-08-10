import React from "react";
import { useRecipientScreenContentViewModel } from "../hooks/useRecipientScreenContentViewModel";
import type { ReadyRecipientScreenViewModel } from "../hooks/useRecipientScreenViewModel";
import { RecipientScreenView } from "./RecipientScreenView";

type RecipientScreenContainerProps = Readonly<{
  screenViewModel: ReadyRecipientScreenViewModel;
}>;

export function RecipientScreenContainer({ screenViewModel }: RecipientScreenContainerProps) {
  const viewModel = useRecipientScreenContentViewModel(screenViewModel);

  return <RecipientScreenView viewModel={viewModel} />;
}
