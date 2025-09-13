import { StepProps as CommonStepProps } from "~/renderer/modals/AddAccounts/index";
import { StepProps as ReceiveStepProps } from "~/renderer/modals/Receive/Body";

export type CantonFamily = {
  NoAssociatedAccounts: React.ComponentType<CommonStepProps>;
  StepReceiveFunds: React.ComponentType<ReceiveStepProps>;
};
