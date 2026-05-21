import React from "react";
import type { UseOptionsMenuViewModelProps } from "./useOptionsMenuViewModel";
import { useOptionsMenuViewModel } from "./useOptionsMenuViewModel";
import { OptionsMenuView } from "./OptionsMenuView";

export function OptionsMenu(props: UseOptionsMenuViewModelProps) {
  const viewModel = useOptionsMenuViewModel(props);
  return <OptionsMenuView viewModel={viewModel} />;
}
