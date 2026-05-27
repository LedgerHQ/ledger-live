import React from "react";
import { GenericAwarenessModalDrawerView } from "../components/GenericAwarenessModalDrawer";
import { useGenericAwarenessModalDrawerViewModel } from "./useGenericAwarenessModalDrawerViewModel";

export function GenericAwarenessModalDrawer() {
  return <GenericAwarenessModalDrawerView {...useGenericAwarenessModalDrawerViewModel()} />;
}
