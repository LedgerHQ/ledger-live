import {
  SuiAccount,
  Transaction,
  TransactionStatus,
} from "@ledgerhq/live-common/families/sui/types";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { Operation } from "@ledgerhq/types-live";
import { TFunction } from "i18next";
import { OpenModal } from "~/renderer/reducers/modals";
import { Step } from "~/renderer/components/Stepper";
export type StepId = "validator" | "amount" | "connectDevice" | "confirmation";
export type StepProps = {
  readonly t: TFunction;
  readonly transitionTo: (a: string) => void;
  readonly device: Device | undefined | null;
  readonly account: SuiAccount;
  readonly parentAccount: never;
  readonly onRetry: (a: void) => void;
  readonly onClose: () => void;
  readonly openModal: OpenModal;
  readonly optimisticOperation: Operation | undefined;
  readonly error: Error | undefined;
  readonly signed: boolean;
  readonly transaction: Transaction | undefined | null;
  readonly status: TransactionStatus;
  readonly onChangeTransaction: (a: Transaction) => void;
  readonly onUpdateTransaction: (a: (a: Transaction) => Transaction) => void;
  readonly onTransactionError: (a: Error) => void;
  readonly onOperationBroadcasted: (a: Operation) => void;
  readonly setSigned: (a: boolean) => void;
  readonly bridgePending: boolean;
  readonly source?: string;
};
export type St = Step<StepId, StepProps>;
