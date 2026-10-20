import React from "react";
import { FamilyAppEffectsView } from "./FamilyAppEffectsView";
import { useFamilyAppEffectsViewModel } from "./useFamilyAppEffectsViewModel";

/** Mounts the app-wide effect of every coin family the user holds an account of, if it has one. */
export function FamilyAppEffects() {
  const viewModel = useFamilyAppEffectsViewModel();
  return <FamilyAppEffectsView viewModel={viewModel} />;
}
