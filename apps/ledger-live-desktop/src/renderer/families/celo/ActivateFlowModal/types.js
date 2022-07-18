// @flow

import type { Step } from "~/renderer/components/Stepper";
import type { CoreStakingFlowModalStepProps } from "../types";

export type StepId = "vote" | "connectDevice" | "confirmation";

export type StepProps = CoreStakingFlowModalStepProps;

export type St = Step<StepId, StepProps>;
