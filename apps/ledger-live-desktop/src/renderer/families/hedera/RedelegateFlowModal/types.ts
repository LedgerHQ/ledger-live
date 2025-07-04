import { TFunction } from "i18next";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import {
  HederaAccount,
  Transaction,
  TransactionStatus,
} from "@ledgerhq/live-common/families/hedera/types";
import { Operation } from "@ledgerhq/types-live";
import { Step } from "~/renderer/components/Stepper";

export type StepId = "validators" | "connectDevice" | "confirmation";

export type StepProps = {
  t: TFunction;
  transitionTo: (a: string) => void;
  device: Device | undefined | null;
  account: HederaAccount | undefined | null;
  parentAccount: HederaAccount | undefined | null;
  onRetry: (a: void) => void;
  onClose: () => void;
  openModal: (key: string, config?: unknown) => void;
  optimisticOperation: Operation;
  error: Error;
  signed: boolean;
  transaction: Transaction | undefined | null;
  status: TransactionStatus;
  onChangeTransaction: (a: Transaction) => void;
  onUpdateTransaction: (a: (a: Transaction) => Transaction) => void;
  onTransactionError: (a: Error) => void;
  onOperationBroadcasted: (a: Operation) => void;
  setSigned: (a: boolean) => void;
  bridgePending: boolean;
  source?: string;
};

export type St = Step<StepId, StepProps>;
