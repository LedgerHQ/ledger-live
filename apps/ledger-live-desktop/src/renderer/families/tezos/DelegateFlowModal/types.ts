import { TFunction } from "i18next";
import { Account, AccountLike, Operation } from "@ledgerhq/types-live";
import { Transaction, TransactionStatus } from "@ledgerhq/live-common/families/tezos/types";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { Step as StepperProps } from "~/renderer/components/Stepper";
import { OpenModal } from "~/renderer/actions/modals";

export type StepId =
  | "starter"
  | "account"
  | "summary"
  | "validator"
  | "custom"
  | "device"
  | "confirmation";

export type StepProps = {
  t: TFunction;
  transitionTo: (a: string) => void;
  openedFromAccount: boolean;
  device: Device | undefined | null;
  account: AccountLike | undefined | null;
  parentAccount: Account | undefined | null;
  eventType?: string;
  transaction: Transaction | undefined | null;
  status: TransactionStatus;
  bridgePending: boolean;
  error: Error | undefined | null;
  optimisticOperation: Operation | undefined | null;
  onClose: () => void;
  openModal: OpenModal;
  onChangeAccount: (b?: AccountLike | null, a?: Account | null) => void;
  onChangeTransaction: (a: Transaction) => void;
  onTransactionError: (a: Error) => void;
  onOperationBroadcasted: (a: Operation) => void;
  onRetry: (a: void) => void;
  setSigned: (a: boolean) => void;
  signed: boolean;
  openedWithAccount: boolean;
  source?: string;
};

export type Step = StepperProps<StepId, StepProps>;
