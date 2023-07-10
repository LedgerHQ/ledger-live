import { TFunction } from "react-i18next";
import { Account, AnyMessage } from "@ledgerhq/types-live";
import { Step } from "~/renderer/components/Stepper";

export type StepId = "summary" | "sign";

export type StepProps = {
  t: TFunction;
  transitionTo: (str: string) => void;
  account: Account;
  error: Error | undefined;
  message: AnyMessage;
  onConfirmationHandler: (arg: string) => void;
  onFailHandler: (arg: Error) => void;
};

export type St = Step<StepId, StepProps>;
