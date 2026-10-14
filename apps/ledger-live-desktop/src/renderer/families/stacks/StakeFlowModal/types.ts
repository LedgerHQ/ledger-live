import { TFunction } from "i18next";
import { Operation } from "@ledgerhq/types-live";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import {
  StacksAccount,
  Transaction,
  TransactionStatus,
} from "@ledgerhq/live-common/families/stacks/types";
import { Step as StepperProps } from "~/renderer/components/Stepper";

export type StepId = "validator" | "amount" | "connectDevice" | "confirmation";

export type StepProps = {
  t: TFunction;
  transitionTo: (a: string) => void;
  device: Device | undefined | null;
  account: StacksAccount | undefined | null;
  transaction: Transaction | undefined | null;
  status: TransactionStatus;
  bridgePending: boolean;
  error: Error | undefined | null;
  optimisticOperation: Operation | undefined | null;
  signed: boolean;
  source?: string;
  onClose: () => void;
  onChangeTransaction: (a: Transaction) => void;
  onTransactionError: (a: Error) => void;
  onOperationBroadcasted: (a: Operation) => void;
  onRetry: () => void;
  setSigned: (a: boolean) => void;
};

export type Step = StepperProps<StepId, StepProps>;
