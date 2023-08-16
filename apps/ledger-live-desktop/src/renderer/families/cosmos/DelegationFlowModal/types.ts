import { TFunction } from "i18next";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { Step } from "~/renderer/components/Stepper";
import {
  CosmosAccount,
  Transaction,
  TransactionStatus,
  CosmosOperation,
} from "@ledgerhq/live-common/families/cosmos/types";
import { OpenModal } from "~/renderer/actions/modals";
export type StepId = "validator" | "amount" | "connectDevice" | "confirmation";
export type StepProps = {
  t: TFunction;
  transitionTo: (a: string) => void;
  device: Device | undefined | null;
  account: CosmosAccount;
  parentAccount: never;
  onRetry: (a: void) => void;
  onClose: () => void;
  openModal: OpenModal;
  optimisticOperation: CosmosOperation | undefined;
  error: Error | undefined;
  signed: boolean;
  transaction: Transaction | undefined | null;
  status: TransactionStatus;
  onChangeTransaction: (a: Transaction) => void;
  onUpdateTransaction: (a: (a: Transaction) => Transaction) => void;
  onTransactionError: (a: Error) => void;
  onOperationBroadcasted: (a: CosmosOperation) => void;
  setSigned: (a: boolean) => void;
  bridgePending: boolean;
  source?: string;
};
export type St = Step<StepId, StepProps>;
