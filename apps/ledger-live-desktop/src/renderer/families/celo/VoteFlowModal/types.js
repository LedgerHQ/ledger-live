// @flow

import type { Step } from "~/renderer/components/Stepper";
import type { CoreStakingFlowModalStepProps } from "../types";

export type StepId = "validatorGroup" | "amount" | "connectDevice" | "confirmation";

export type StepProps = CoreStakingFlowModalStepProps;

export type St = Step<StepId, StepProps>;
