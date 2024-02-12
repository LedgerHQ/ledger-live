import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { Step } from "~/renderer/components/Stepper";
import {
  Transaction,
  TransactionStatus,
  CosmosAccount,
} from "@ledgerhq/live-common/families/cosmos/types";
import { OpenModal } from "~/renderer/actions/modals";
import { Operation } from "@ledgerhq/types-live";
export type StepId = "amount" | "device" | "confirmation";
export type StepProps = {
  transitionTo: (address: string) => void;
  device: Device | undefined | null;
  account: CosmosAccount;
  parentAccount: never;
  onRetry: () => void;
  onClose: () => void;
  openModal: OpenModal;
  optimisticOperation: Operation | undefined;
  error: Error | undefined;
  signed: boolean;
  transaction: Transaction | undefined | null;
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
