import { TFunction } from "react-i18next";
import { Account } from "@ledgerhq/types-live";
import { MessageData } from "@ledgerhq/live-common/hw/signMessage/types";
// TODO move the specific parts to each family!
// eslint-disable-next-line no-restricted-imports
import { TypedMessageData } from "@ledgerhq/live-common/families/ethereum/types";
// TODO move the specific parts to each family!
// eslint-disable-next-line no-restricted-imports
import { getNanoDisplayedInfosFor712 } from "@ledgerhq/live-common/families/ethereum/hw-signMessage";
import { Step } from "~/renderer/components/Stepper";

export type StepId = "summary" | "sign";

export type StepProps = {
  t: TFunction;
  transitionTo: (str: string) => void;
  account: Account;
  error: Error;
  message: MessageData | TypedMessageData;
  onConfirmationHandler: (arg: string) => void;
  onFailHandler: (arg: Error) => void;
};

export type St = Step<StepId, StepProps>;

export type NanoDisplayedInfoFor712 = Awaited<ReturnType<typeof getNanoDisplayedInfosFor712>>;
