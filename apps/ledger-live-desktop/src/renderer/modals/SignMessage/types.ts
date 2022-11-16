import { TFunction } from "react-i18next";
import { Account } from "@ledgerhq/types-live";
import { MessageData } from "@ledgerhq/live-common/hw/signMessage/types";
import { TypedMessageData } from "@ledgerhq/live-common/families/ethereum/types";
import { getNanoDisplayedInfosFor712 } from "@ledgerhq/live-common/families/ethereum/hw-signMessage";
import { Step } from "~/renderer/components/Stepper";

export type StepId = "summary" | "sign";

export type StepProps = {
  t: TFunction;
  transitionTo: (str: string) => void;
  account: Account;
  error: Error;
  message: MessageData | TypedMessageData;
  onConfirmationHandler: (arg: any) => any;
  onFailHandler: (arg: any) => any;
};

export type St = Step<StepId, StepProps>;

export type NanoDisplayedInfoFor712 = Awaited<ReturnType<typeof getNanoDisplayedInfosFor712>>;
