import { TFunction } from "react-i18next";
import { Step } from "~/renderer/components/Stepper";
import { Account } from "@ledgerhq/types-live";
export type StepId = "paste" | "confirm";
export type StepProps = {
  t: TFunction;
  transitionTo: (a: string) => void;
  account: Account | undefined | null;
  error: any;
  link: string;
  setLink: Function;
  onClose: Function;
  onCloseWithoutDisconnect: Function;
};
export type St = Step<StepId, StepProps>;
