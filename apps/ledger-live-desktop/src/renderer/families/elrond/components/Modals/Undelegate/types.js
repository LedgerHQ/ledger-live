// @flow

import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import type { Account, Transaction, TransactionStatus, Operation } from "@ledgerhq/types-live";
import type { TFunction } from "react-i18next";
import type { Step } from "~/renderer/components/Stepper";
import type { DelegationType } from "~/renderer/families/elrond/types";

export type StepId = "amount" | "device" | "confirmation";
export type StepProps = {
  t: TFunction,
  transitionTo: (param: string) => void,
  device?: Device,
  account?: Account,
  parentAccount?: Account,
  onRetry: () => void,
  onClose: () => void,
  openModal: (key: string, config?: any) => void,
  optimisticOperation: any,
  error: any,
  signed: boolean,
  transaction?: Transaction,
  status: TransactionStatus,
  onChangeTransaction: (transaction: Transaction) => void,
  onUpdateTransaction: (transaction: Transaction) => void,
  onTransactionError: (error: Error) => void,
  onOperationBroadcasted: (operation: Operation) => void,
  setSigned: (assigned: boolean) => void,
  bridgePending: boolean,
  validatorAddress: string,
  contract: string,
  amount: string,
  delegations: Array<DelegationType>,
};

export type St = Step<StepId, StepProps>;
