import React from "react";
import { ModularDrawerFlowView, ModularDrawerFlowViewModel } from "./ModularDrawerFlowView";

export default function ModularDrawerFlow(props: ModularDrawerFlowViewModel) {
  return <ModularDrawerFlowView viewModel={props} />;
}
