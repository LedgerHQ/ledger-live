import { TFunction } from "i18next";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { Operation } from "@ledgerhq/types-live";
import { DelegationType } from "~/renderer/families/multiversx/types";
import {
  MultiversXAccount,
  Transaction,
  TransactionStatus,
  MultiversXProvider,
} from "@ledgerhq/live-common/families/multiversx/types";
import { Step } from "~/renderer/components/Stepper";
import { OpenModal } from "~/renderer/actions/modals";
export type StepId = "validator" | "amount" | "connectDevice" | "confirmation";

export type StepProps = {
  t: TFunction;
  transitionTo: (param: string) => void;
  device?: Device;
  account?: MultiversXAccount;
  onRetry: () => void;
  onClose: () => void;
  openModal: OpenModal;
  optimisticOperation: Operation | undefined;
  source: string;
  error: Error | undefined;
  signed: boolean;
  transaction?: Transaction;
  status: TransactionStatus;
  onChangeTransaction: (transaction: Transaction) => void;
  onUpdateTransaction: (transaction: (_: Transaction) => Transaction) => void;
  onTransactionError: (error: Error) => void;
  onOperationBroadcasted: (operation: Operation) => void;
  setSigned: (assigned: boolean) => void;
  bridgePending: boolean;
  validators: Array<MultiversXProvider>;
  delegations: Array<DelegationType>;
};
export type St = Step<StepId, StepProps>;
