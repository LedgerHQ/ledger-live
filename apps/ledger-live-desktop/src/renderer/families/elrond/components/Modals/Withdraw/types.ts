// @flow

import { TFunction } from "react-i18next";
import { Device } from "@ledgerhq/live-common/lib/hw/actions/types";
import { Step } from "~/renderer/components/Stepper";

import { Account, TransactionStatus, Operation } from "@ledgerhq/live-common/types/index";

import { Transaction } from "@ledgerhq/live-common/lib/families/cosmos/types";

export type StepId = "claimRewards" | "connectDevice" | "confirmation";

export interface StepProps {
  t: TFunction;
  transitionTo: (param: string) => void;
  device?: Device;
  account?: Account;
  parentAccount?: Account;
  onRetry: () => void;
  onClose: () => void;
  openModal: (key: string, config?: any) => void;
  optimisticOperation: any;
  error: any;
  signed: boolean;
  transaction?: Transaction;
  status: TransactionStatus;
  onChangeTransaction: (transaction: Transaction) => void;
  onUpdateTransaction: (transaction: Transaction) => void;
  onTransactionError: (error: Error) => void;
  onOperationBroadcasted: (operation: Operation) => void;
  setSigned: (assigned: boolean) => void;
  bridgePending: boolean;
  contract?: string;
  validators?: any;
  delegations?: any;
}

export type St = Step<StepId, StepProps>;
