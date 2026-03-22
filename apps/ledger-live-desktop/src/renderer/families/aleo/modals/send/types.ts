import type { Step } from "~/renderer/components/Stepper";
import type { Data as GenericData } from "~/renderer/modals/Send/Body";
import type {
  StepProps as GenericStepProps,
  StepId as GenericStepId,
} from "~/renderer/modals/Send/types";

type AleoCustomStepId = "private-sync" | "record-picker";

export type StepId = Exclude<GenericStepId, "warning"> | AleoCustomStepId;

export type St = Step<StepId, GenericStepProps>;

export interface ModalProps {
  stepId?: StepId;
  onClose?: () => void;
}

export interface Data extends Omit<GenericData, "stepId"> {
  stepId?: StepId;
}
