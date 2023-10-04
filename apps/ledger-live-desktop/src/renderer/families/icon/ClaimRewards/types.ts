// @flow
import type { TFunction } from "i18next";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import type { Step } from "~/renderer/components/Stepper";
import type { BigNumber } from "bignumber.js";

import type { Account, Operation } from "@ledgerhq/types-live";

import type { Transaction, TransactionStatus } from "@ledgerhq/live-common/generated/types";
import { OpenModal } from "~/renderer/actions/modals";
export type StepId = "rewards" | "connectDevice" | "confirmation";

export type StepProps = {
  t: TFunction;
  transitionTo: (string: string) => void;
  device: Device | undefined | null;
  account: Account | undefined | null;
  parentAccount: Account | undefined | null;
  onRetry: (a: void) => void;
  onClose: () => void;
  openModal: OpenModal;
  reward?: BigNumber;
  optimisticOperation: Operation | undefined;
  error: Error | undefined;
  signed: boolean;
  transaction?: Transaction;
  status: TransactionStatus;
  onTransactionError: (a: Error) => void;
  onOperationBroadcasted: (a: Operation) => void;
  setSigned: (a: boolean) => void;
};

export type St = Step<StepId, StepProps>;
