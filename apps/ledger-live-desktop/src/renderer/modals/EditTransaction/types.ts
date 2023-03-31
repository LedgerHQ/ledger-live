import { TFunction } from "react-i18next";
import { Account, AccountLike, Operation, TransactionCommonRaw } from "@ledgerhq/types-live";
import { Transaction, TransactionStatus } from "@ledgerhq/live-common/generated/types";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { Step } from "~/renderer/components/Stepper";

export type StepId = "method" | "fees" | "summary" | "device" | "confirmation";

export type StepProps = {
  t: TFunction;
  transitionTo: (a: string) => void;
  device: Device | undefined | null;
  account: AccountLike | undefined | null;
  parentAccount: Account | undefined | null;
  transaction: Transaction | undefined | null;
  status: TransactionStatus;
  bridgePending: boolean;
  error: Error | undefined | null;
  optimisticOperation: Operation | undefined | null;
  closeModal: (a: void) => void;
  openModal: (b: string, a: any) => void;
  onChangeTransaction: (a: Transaction) => void;
  onTransactionError: (a: Error) => void;
  onOperationBroadcasted: (a: Operation) => void;
  onRetry: (a: void) => void;
  setSigned: (a: boolean) => void;
  signed: boolean;
  updateTransaction: (updater: any) => void;
  onConfirmationHandler: Function;
  onFailHandler: Function;
  currencyName: string | undefined | null;
  transactionRaw: TransactionCommonRaw;
  transactionSequenceNumber: number;
  isNftOperation: boolean;
  editType: string | undefined | null;
  haveFundToSpeedup: boolean;
  haveFundToCancel: boolean;
  isOldestEditableOperation: boolean;
  setEditType: (a: string) => void;
  setIsNFTSend: (a: boolean) => void;
};

export type St = Step<StepId, StepProps>;
