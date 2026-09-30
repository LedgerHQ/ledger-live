import type {
  HederaGenericTransaction,
  TransactionStatus,
} from "@ledgerhq/live-common/families/hedera/types";
import type { Operation } from "@ledgerhq/types-live";
import type {
  StepProps as DefaultStepProps,
  Data as DefaultData,
  StepId as DefaultStepId,
} from "~/renderer/modals/Receive/Body";

type CustomStepId = "associationDevice" | "associationConfirmation";

export type StepId = DefaultStepId | CustomStepId;

export type Data = DefaultData;

export type StepProps = DefaultStepProps & {
  isAssociationFlow: boolean;
  transaction: HederaGenericTransaction | undefined | null;
  optimisticOperation: Operation | undefined;
  error: Error | undefined;
  status: TransactionStatus;
  signed: boolean;
  bridgePending: boolean;
  setSigned: (signed: boolean) => void;
  onChangeTransaction: (tx: HederaGenericTransaction) => void;
  onUpdateTransaction: (
    updater: (tx: HederaGenericTransaction) => HederaGenericTransaction,
  ) => void;
  onTransactionError: (err: Error) => void;
  onOperationBroadcasted: (op: Operation) => void;
};
