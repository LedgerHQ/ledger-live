import { TFunction } from "react-i18next";
import { Account, AccountLike, Operation } from "@ledgerhq/types-live";
import { Transaction, TransactionStatus } from "@ledgerhq/live-common/generated/types";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { Step } from "~/renderer/components/Stepper";
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
  closeModal: (a: void) => void;
  openModal: (b: string, a: any) => void;
  onChangeAccount: (b?: AccountLike | null, a?: Account | null) => void;
  onChangeTransaction: (a: Transaction) => void;
  onTransactionError: (a: Error) => void;
  onOperationBroadcasted: (a: Operation) => void;
  onRetry: (a: void) => void;
  setSigned: (a: boolean) => void;
  signed: boolean;
  isRandomChoice: boolean;
  openedWithAccount: boolean;
};
export type St = Step<StepId, StepProps>;
