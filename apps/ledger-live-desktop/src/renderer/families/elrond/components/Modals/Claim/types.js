// @flow

import { TFunction } from "react-i18next";
import { Operation } from "@ledgerhq/types-live";
import { Device } from "@ledgerhq/live-common/lib/hw/actions/types";
import { ElrondAccount, Transaction, TransactionStatus } from "@ledgerhq/live-common/lib/families/elrond/types";
import { Step } from "~/renderer/components/Stepper";

export type StepId = "claimRewards" | "connectDevice" | "confirmation";

export interface StepProps {
  t: TFunction;
  transitionTo: (param: string) => void;
  device?: Device;
  account?: ElrondAccount;
  parentAccount?: ElrondAccount;
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
