// @flow

import type { TFunction } from "react-i18next";
import type { Account, AccountLike, Operation } from "@ledgerhq/types-live";
import type { Transaction, TransactionStatus } from "@ledgerhq/live-common/generated/types";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import type { Step } from "~/renderer/components/Stepper";

export type StepId =
  | "starter"
  | "account"
  | "summary"
  | "validator"
  | "custom"
  | "device"
  | "confirmation";

export type StepProps = {
  t: TFunction,
  transitionTo: string => void,
  openedFromAccount: boolean,
  device: ?Device,
  account: ?AccountLike,
  parentAccount: ?Account,
  eventType?: string,
  transaction: ?Transaction,
  status: TransactionStatus,
  bridgePending: boolean,
  error: ?Error,
  optimisticOperation: ?Operation,
  closeModal: void => void,
  openModal: (string, any) => void,
  onChangeAccount: (?AccountLike, ?Account) => void,
  onChangeTransaction: Transaction => void,
  onTransactionError: Error => void,
  onOperationBroadcasted: Operation => void,
  onRetry: void => void,
  setSigned: boolean => void,
  signed: boolean,
  isRandomChoice: boolean,
  openedWithAccount: boolean,
};

export type St = Step<StepId, StepProps>;
