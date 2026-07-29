import type { PostOnboardingActionId, StartActionArgs } from "@ledgerhq/types-live";
import type { DeviceModelId } from "@ledgerhq/types-devices";
import type { FinishFlowLumenSymbol } from "LLD/features/FinishOnboarding/FinishOnboardingDialog/components/PostOnboardingAction/types";

/** One row in the finish-onboarding dialog / widget stepper (no hub-only fields like `titleCompleted`). */
export type FinishOnboardingStep = {
  readonly id: PostOnboardingActionId;
  readonly title: string;
  readonly description?: string;
  readonly completed: boolean;
  readonly lumenSymbol: FinishFlowLumenSymbol;
  readonly buttonLabelForAnalyticsEvent?: string;
  readonly shouldCompleteOnStart?: boolean;
  readonly startAction: (args: StartActionArgs) => void;
};

export type FinishOnboardingState = {
  readonly deviceModelId: DeviceModelId | null;
  readonly postOnboardingInProgress: boolean;
  /** Includes the always-complete device row as the first step. */
  readonly steps: FinishOnboardingStep[];
  readonly completedStepsAmount: number;
  readonly totalStepsAmount: number;
  /** True when every optional step (excluding the implicit device row) is complete. */
  readonly allStepsCompleted: boolean;
};
