import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { Step } from "~/renderer/components/Stepper";
import { Operation } from "@ledgerhq/types-live";
import {
  NearAccount,
  Transaction,
  TransactionStatus,
} from "@ledgerhq/live-common/families/near/types";
import { OpenModal } from "~/renderer/actions/modals";
export type StepId = "amount" | "device" | "confirmation";
export type StepProps = {
  transitionTo: (address: string) => void;
  device: Device | undefined | null;
  account: NearAccount;
  parentAccount: never;
  onRetry: () => void;
  onClose: () => void;
  openModal: OpenModal;
  optimisticOperation: Operation | undefined;
  error: Error | undefined;
  signed: boolean;
  transaction: Transaction;
  status: TransactionStatus;
  onChangeTransaction: (tx: Transaction) => void;
  onUpdateTransaction: (a: (tx: Transaction) => Transaction) => void;
  onTransactionError: (error: Error) => void;
  onOperationBroadcasted: (operation: Operation) => void;
  setSigned: (signed: boolean) => void;
  bridgePending: boolean;
  validatorAddress: string;
};
export type St = Step<StepId, StepProps>;
