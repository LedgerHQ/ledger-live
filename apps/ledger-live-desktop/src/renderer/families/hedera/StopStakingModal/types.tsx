// @flow

import type { Step } from "~/renderer/components/Stepper";

export type StepId = "confirmation" | "connectDevice" | "success";

export type St = Step<StepId, StepProps>;