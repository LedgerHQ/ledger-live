import type { TFunction } from "i18next";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import type {
  HederaAccount,
  Transaction,
  TransactionStatus,
} from "@ledgerhq/live-common/families/hedera/types";
import type { Operation } from "@ledgerhq/types-live";
import type { Step } from "~/renderer/components/Stepper";
import type { OpenModal } from "~/renderer/reducers/modals";

export type StepId = "rewards" | "connectDevice" | "confirmation";

export type StepProps = {
  t: TFunction;
  transitionTo: (a: string) => void;
  device: Device | undefined | null;
  account: HederaAccount | undefined | null;
  parentAccount: HederaAccount | undefined | null;
  onRetry: (a: void) => void;
  onClose: () => void;
  openModal: OpenModal;
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
