import { TFunction } from "i18next";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { Step } from "~/renderer/components/Stepper";
import type { GenericTransaction } from "@ledgerhq/live-common/bridge/generic-coin-framework/types";
import { OpenModal } from "~/renderer/actions/modals";
import { Account, TransactionStatusCommon, Operation } from "@ledgerhq/types-live";

export type StepId = "claimRewards" | "connectDevice" | "confirmation";

export type StepProps = {
  account: Account;
  bridgePending: boolean;
  device: Device | undefined | null;
  error: Error | undefined;
  onChangeTransaction: (transaction: GenericTransaction) => void;
  onClose: () => void;
  onOperationBroadcasted: (operation: Operation) => void;
  onRetry: (a: void) => void;
  onTransactionError: (error: Error) => void;
  onUpdateTransaction: (
    updateTransaction: (transaction: GenericTransaction) => GenericTransaction,
  ) => void;
  openModal: OpenModal;
  optimisticOperation: Operation | undefined;
  parentAccount: never;
  setSigned: (signed: boolean) => void;
  signed: boolean;
  status: TransactionStatusCommon;
  t: TFunction;
  transaction: GenericTransaction | undefined | null;
  transitionTo: (a: string) => void;
  warning: Error | undefined;
};

export type St = Step<StepId, StepProps>;
