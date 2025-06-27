import React from "react";
import { useModularDrawerFlowStepManager } from "../hooks/useModularDrawerFlowStepManager";
import { ModularDrawerFlowView } from "./ModularDrawerFlowView";
import { ModularDrawerStep } from "../types";

export interface ModularDrawerFlowProps {
  selectedStep?: ModularDrawerStep;
}

export default function ModularDrawerFlow(props: ModularDrawerFlowProps) {
  const viewModel = useModularDrawerFlowStepManager(props);
  return <ModularDrawerFlowView viewModel={viewModel} />;
}
