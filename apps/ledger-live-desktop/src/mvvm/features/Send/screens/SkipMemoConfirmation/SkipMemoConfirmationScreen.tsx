import React from "react";
import { SkipMemoConfirmationView } from "./components/SkipMemoConfirmationView";
import { useSkipMemoConfirmationViewModel } from "./hooks/useSkipMemoConfirmationViewModel";

export function SkipMemoConfirmationScreen() {
  const viewModel = useSkipMemoConfirmationViewModel();

  return <SkipMemoConfirmationView {...viewModel} />;
}
