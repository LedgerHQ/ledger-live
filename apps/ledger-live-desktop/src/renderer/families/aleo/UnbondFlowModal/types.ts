import { Step } from "~/renderer/components/Stepper";
import type { StakingStepProps } from "../shared/createStakingFlowBody";

export type StepId = "amount" | "connectDevice" | "confirmation";

export type StepProps = Readonly<StakingStepProps>;

export type St = Step<StepId, StepProps>;
