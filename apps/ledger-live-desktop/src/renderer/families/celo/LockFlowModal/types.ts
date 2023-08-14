import { Step } from "~/renderer/components/Stepper";
import { CoreStakingFlowModalStepProps } from "../types";
export type StepId = "amount" | "connectDevice" | "confirmation";
export type StepProps = CoreStakingFlowModalStepProps;
export type St = Step<StepId, StepProps>;
