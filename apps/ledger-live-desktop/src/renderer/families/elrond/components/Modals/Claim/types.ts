import { TFunction } from "i18next";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { Step } from "~/renderer/components/Stepper";
import { Operation } from "@ledgerhq/types-live";
import { DelegationType } from "~/renderer/families/elrond/types";
import {
  ElrondAccount,
  ElrondProvider,
  Transaction,
  TransactionStatus,
} from "@ledgerhq/live-common/families/elrond/types";
import { OpenModal } from "~/renderer/actions/modals";
export type StepId = "claimRewards" | "connectDevice" | "confirmation";
export type StepProps = {
  t: TFunction;
  transitionTo: (param: string) => void;
  device?: Device;
  account: ElrondAccount;
  onRetry: () => void;
  onClose: () => void;
  openModal: OpenModal;
  optimisticOperation: Operation | undefined;
  error: Error | undefined;
  warning: Error | undefined;
  signed: boolean;
  transaction?: Transaction;
  status: TransactionStatus;
  onChangeTransaction: (transaction: Transaction) => void;
  onUpdateTransaction: (transaction: (_: Transaction) => Transaction) => void;
  onTransactionError: (error: Error) => void;
  onOperationBroadcasted: (operation: Operation) => void;
  setSigned: (assigned: boolean) => void;
  bridgePending: boolean;
  contract?: string;
  validators?: Array<ElrondProvider>;
  delegations?: Array<DelegationType>;
};
export type St = Step<StepId, StepProps>;
