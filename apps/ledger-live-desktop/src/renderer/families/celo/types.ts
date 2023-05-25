import { TFunction } from "react-i18next";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import {
  CeloAccount,
  Transaction,
  TransactionStatus,
} from "@ledgerhq/live-common/families/celo/types";
import { LLDCoinFamily } from "../types";
import { OpenModal } from "~/renderer/actions/modals";
import { Operation } from "@ledgerhq/types-live";

export type CoreStakingFlowModalStepProps = {
  t: TFunction;
  transitionTo: (string: string) => void;
  device: Device | undefined | null;
  account: CeloAccount;
  parentAccount: CeloAccount | undefined | null;
  onRetry: (a: void) => void;
  onClose: () => void;
  openModal: OpenModal;
  optimisticOperation: Operation | undefined;
  error: Error | undefined;
  warning: Error | undefined;
  signed: boolean;
  transaction: Transaction;
  status: TransactionStatus;
  onChangeTransaction: (a: Transaction) => void;
  onUpdateTransaction: (a: (a: Transaction) => Transaction) => void;
  onTransactionError: (a: Error) => void;
  onOperationBroadcasted: (a: Operation) => void;
  setSigned: (a: boolean) => void;
  bridgePending: boolean;
  source?: string;
};

export type CeloFamily = LLDCoinFamily<CeloAccount, Transaction, TransactionStatus>;
