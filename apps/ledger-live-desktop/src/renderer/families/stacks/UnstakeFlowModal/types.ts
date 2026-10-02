import { TFunction } from "i18next";
import { Operation } from "@ledgerhq/types-live";
import {
  StacksAccount,
  Transaction,
  TransactionStatus,
} from "@ledgerhq/live-common/families/stacks/types";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { Step as StepperProps } from "~/renderer/components/Stepper";

export type StepId = "connectDevice" | "confirmation";

export type StepProps = {
  t: TFunction;
  transitionTo: (a: string) => void;
  device: Device | undefined | null;
  account: StacksAccount;
  transaction: Transaction;
  status: TransactionStatus;
  bridgePending: boolean;
  signed: boolean;
  optimisticOperation: Operation | null;
  error: Error | null;
  source?: string;
  onClose: () => void;
  onChangeTransaction: (a: Transaction) => void;
  onOperationBroadcasted: (a: Operation) => void;
  onTransactionError: (a: Error) => void;
  onRetry: () => void;
  setSigned: (a: boolean) => void;
};

export type Step = StepperProps<StepId, StepProps>;
