import type { Step } from "~/renderer/components/Stepper";
import type { StepProps as GenericStepProps } from "~/renderer/modals/Send/types";
import type { Data as GenericData } from "~/renderer/modals/Send/Body";

export type StepId =
  | "recipient"
  | "private-sync"
  | "record-picker"
  | "amount"
  | "summary"
  | "device"
  | "confirmation";

export type St = Step<StepId, GenericStepProps>;

export interface ModalProps {
  stepId?: StepId;
  onClose?: () => void;
}

export interface Data extends Omit<GenericData, "stepId"> {
  stepId?: StepId;
}
