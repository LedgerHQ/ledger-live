import { TFunction } from "react-i18next";
import { Account, AccountLike, Operation } from "@ledgerhq/types-live";
import { Transaction as TransactionCommon } from "@ledgerhq/live-common/generated/types";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { Step } from "~/renderer/components/Stepper";
import { Transaction, TransactionStatus } from "@ledgerhq/coin-evm/types/index";

export type StepId = "method" | "fees" | "summary" | "device" | "confirmation";

export type StepProps = {
  device: Device | undefined | null;
  account: AccountLike | undefined | null;
  parentAccount: Account | undefined | null;
  transaction: Transaction;
  status: TransactionStatus;
  bridgePending: boolean;
  error: Error | undefined | null;
  optimisticOperation: Operation | undefined | null;
  signed: boolean;
  currencyName: string | undefined | null;
  transactionHash: string;
  editType: "cancel" | "speedup" | undefined;
  haveFundToSpeedup: boolean;
  haveFundToCancel: boolean;
  isOldestEditableOperation: boolean;
  // `transactionToUpdate` is needed because `transaction` above is updated through the stepper by the bridge
  transactionToUpdate: Transaction;
  t: TFunction;
  closeModal: (a: void) => void;
  openModal: (b: string, a: unknown) => void;
  onChangeTransaction: (a: TransactionCommon) => void;
  onTransactionError: (a: Error) => void;
  onOperationBroadcasted: (a: Operation) => void;
  onRetry: (a: void) => void;
  setSigned: (a: boolean) => void;
  updateTransaction: (updater: (a: Transaction) => void) => void;
  transitionTo: (a: string) => void;
  setEditType: (a: string) => void;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type St = Step<StepId, any>;
