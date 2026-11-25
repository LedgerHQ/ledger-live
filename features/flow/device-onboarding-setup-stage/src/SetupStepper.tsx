import React from "react";
import type { SetupStepperProps } from "./SetupStepper.types";
import { SetupStepperView } from "./SetupStepperView";
import { useSetupStepperViewModel } from "./useSetupStepperViewModel";

export function SetupStepper(props: SetupStepperProps) {
  return <SetupStepperView {...useSetupStepperViewModel(props)} />;
}
