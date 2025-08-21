import type { Transaction, TransactionStatus } from "@ledgerhq/live-common/families/hedera/types";
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
  transaction: Transaction | undefined | null;
  optimisticOperation: Operation | undefined;
  error: Error | undefined;
  status: TransactionStatus;
  signed: boolean;
  bridgePending: boolean;
  setSigned: (a: boolean) => void;
  onChangeTransaction: (a: Transaction) => void;
  onUpdateTransaction: (a: (a: Transaction) => Transaction) => void;
  onTransactionError: (a: Error) => void;
  onOperationBroadcasted: (a: Operation) => void;
};
