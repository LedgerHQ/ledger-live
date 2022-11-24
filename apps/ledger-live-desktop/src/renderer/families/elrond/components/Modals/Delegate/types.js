// @flow

import type { TFunction } from "react-i18next";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import type { Account, Transaction, TransactionStatus, Operation } from "@ledgerhq/types-live";
import type { DelegationType, ElrondProvider } from "~/renderer/families/elrond/types";

import type { Step } from "~/renderer/components/Stepper";

export type StepId = "validator" | "amount" | "connectDevice" | "confirmation";

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
  validators: Array<ElrondProvider>,
  delegations: Array<DelegationType>,
};

export type St = Step<StepId, StepProps>;
