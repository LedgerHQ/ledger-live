import { TFunction } from "i18next";
import { Account, Operation, TokenAccount } from "@ledgerhq/types-live";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import {
  TezosAccount,
  Transaction,
  TransactionStatus,
} from "@ledgerhq/live-common/families/tezos/types";
import { Step } from "~/renderer/components/Stepper";
import { OpenModal } from "~/renderer/actions/modals";

export type StepId =
  | "validator"
  | "device-delegation"
  | "amount"
  | "device-staking"
  | "confirmation";

export type StepProps = {
  t: TFunction;
  transitionTo: (a: string) => void;
  device: Device | undefined | null;
  account: TezosAccount | TokenAccount | undefined | null;
  parentAccount: Account | undefined | null;
  transaction: Transaction | undefined | null;
  status: TransactionStatus;
  bridgePending: boolean;
  error: Error | undefined | null;
  optimisticOperation: Operation | undefined | null;
  signed: boolean;
  failedStep: StepId | null;
  source?: string;
  onClose: () => void;
  openModal: OpenModal;
  onChangeTransaction: (a: Transaction) => void;
  onUpdateTransaction: (a: (a: Transaction) => Transaction) => void;
  onTransactionError: (a: Error) => void;
  onOperationBroadcasted: (a: Operation) => void;
  onRetry: () => void;
  setSigned: (a: boolean) => void;
};

export type St = Step<StepId, StepProps>;
