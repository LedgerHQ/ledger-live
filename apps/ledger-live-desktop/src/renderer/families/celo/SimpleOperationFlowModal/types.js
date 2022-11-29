// @flow

import type { Step } from "~/renderer/components/Stepper";
import type { CoreStakingFlowModalStepProps } from "../types";

export type Mode = "register";

export type StepId = "info" | "connectDevice" | "confirmation";

export type StepProps = {
  mode: Mode,
} & CoreStakingFlowModalStepProps;

export type St = Step<StepId, StepProps>;
