import React from "react";
import { ModularDrawerFlowView } from "./ModularDrawerFlowView";
import { AssetSelectionStepProps } from "../screens/AssetSelection";
import { NetworkSelectionStepProps } from "../screens/NetworkSelection";
import { StepFlowManagerReturnType } from "../hooks/useModularDrawerFlowStepManager";

export interface ModularDrawerFlowProps {
  navigationStepViewModel: StepFlowManagerReturnType;
  assetsViewModel: AssetSelectionStepProps;
  networksViewModel: NetworkSelectionStepProps;
  isReadyToBeDisplayed?: boolean;
}

/**
 * Renders the modular drawer flow view, switching between steps.
 * @param {object} props - The flow view props.
 * @param {StepFlowManagerReturnType} props.navigationStepViewModel - The navigation step view model.
 * @param {AssetSelectionStepProps} props.assetsViewModel - The asset selection view model.
 * @param {NetworkSelectionStepProps} props.networksViewModel - The network selection view model.
 * @param {boolean} [props.isReadyToBeDisplayed] - Whether the drawer is ready to be displayed.
 */
export default function ModularDrawerFlow(props: ModularDrawerFlowProps) {
  return (
    <ModularDrawerFlowView
      navigationStepViewModel={props.navigationStepViewModel}
      assetsViewModel={props.assetsViewModel}
      networksViewModel={props.networksViewModel}
      isReadyToBeDisplayed={props.isReadyToBeDisplayed}
    />
  );
}
