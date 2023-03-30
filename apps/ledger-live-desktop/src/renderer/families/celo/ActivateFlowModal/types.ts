import { Step } from "~/renderer/components/Stepper";
import { CoreStakingFlowModalStepProps } from "../types";
export type StepId = "vote" | "connectDevice" | "confirmation";
export type StepProps = CoreStakingFlowModalStepProps;
export type St = Step<StepId, StepProps>;
