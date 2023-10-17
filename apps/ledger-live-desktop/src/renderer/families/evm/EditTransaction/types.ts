import { EditType } from "@ledgerhq/coin-evm/types/editTransaction";
import { Transaction, TransactionStatus } from "@ledgerhq/coin-evm/types/index";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { Account, AccountLike, Operation } from "@ledgerhq/types-live";
import { TFunction } from "i18next";
import { Step } from "~/renderer/components/Stepper";

export type StepId = "method" | "fees" | "summary" | "device" | "confirmation";

export type StepProps = {
  device: Device | undefined | null;
  account: AccountLike;
  parentAccount: Account | undefined | null;
  transaction: Transaction;
  status: TransactionStatus;
  bridgePending: boolean;
  error: Error | undefined | null;
  optimisticOperation: Operation | undefined | null;
  signed: boolean;
  currencyName: string | undefined | null;
  transactionHasBeenValidated: boolean;
  editType?: EditType;
  haveFundToSpeedup: boolean;
  haveFundToCancel: boolean;
  isOldestEditableOperation: boolean;
  // `transactionToUpdate` is needed because `transaction` above is updated through the stepper by the bridge
  transactionToUpdate: Transaction;
  t: TFunction;
  closeModal: (a: void) => void;
  openModal: (b: string, a: unknown) => void;
  onChangeTransaction: (a: Transaction) => void;
  onTransactionError: (a: Error) => void;
  onOperationBroadcasted: (a: Operation) => void;
  onRetry: (a: void) => void;
  setSigned: (a: boolean) => void;
  updateTransaction: (updater: (a: Transaction) => Transaction) => void;
  transitionTo: (a: string) => void;
  setEditType: (a: EditType) => void;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type St = Step<StepId, any>;
