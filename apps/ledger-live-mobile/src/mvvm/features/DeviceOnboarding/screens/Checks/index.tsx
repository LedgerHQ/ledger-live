import React from "react";
import type { ChecksScreenProps } from "LLM/features/DeviceOnboarding/types";
import { ChecksView } from "./ChecksView";
import { useChecksScreenViewModel } from "./useChecksScreenViewModel";

export function ChecksScreen(props: ChecksScreenProps) {
  const viewModel = useChecksScreenViewModel(props);
  return <ChecksView {...viewModel} />;
}
