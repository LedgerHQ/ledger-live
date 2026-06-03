import React from "react";
import { GenericAwarenessModalDevScreenView } from "./GenericAwarenessModalDevScreenView";
import { useGenericAwarenessModalDevScreenViewModel } from "./useGenericAwarenessModalDevScreenViewModel";

export default function GenericAwarenessModalDevScreen() {
  const viewModel = useGenericAwarenessModalDevScreenViewModel();
  return <GenericAwarenessModalDevScreenView {...viewModel} />;
}
