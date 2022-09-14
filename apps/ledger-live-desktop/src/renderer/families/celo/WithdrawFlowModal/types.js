// @flow

import type { Step } from "~/renderer/components/Stepper";
import type { CoreStakingFlowModalStepProps } from "../types";

export type StepId = "amount" | "connectDevice" | "confirmation";

export type StepProps = {
  id: StepId,
} & CoreStakingFlowModalStepProps;

export type St = Step<StepId, StepProps>;
