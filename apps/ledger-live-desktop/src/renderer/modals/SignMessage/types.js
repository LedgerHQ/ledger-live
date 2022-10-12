// @flow
import type { TFunction } from "react-i18next";
import type { Step } from "~/renderer/components/Stepper";
import type { TypedMessageData } from "@ledgerhq/live-common/families/ethereum/types";
import type { MessageData } from "@ledgerhq/live-common/hw/signMessage/types";
import type { Account } from "@ledgerhq/types-live";

export type StepId = "summary" | "sign";

export type StepProps = {
  t: TFunction,
  transitionTo: string => void,
  account: Account,
  error: *,
  message: MessageData | TypedMessageData,
  onConfirmationHandler: Function,
  onFailHandler: Function,
};

export type St = Step<StepId, StepProps>;
