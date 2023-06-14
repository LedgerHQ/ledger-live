import { TFunction } from "react-i18next";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { Step } from "~/renderer/components/Stepper";
import { Operation } from "@ledgerhq/types-live";
import {
  PolkadotAccount,
  Transaction,
  TransactionStatus,
} from "@ledgerhq/live-common/families/polkadot/types";
import { OpenModal } from "~/renderer/actions/modals";
export type StepId = "amount" | "connectDevice" | "confirmation";
export type StepProps = {
  t: TFunction;
  transitionTo: (a: string) => void;
  device: Device | undefined | null;
  account: PolkadotAccount;
  onRetry: (a: void) => void;
  onClose: () => void;
  openModal: OpenModal;
  optimisticOperation: Operation | undefined;
  error: Error | undefined;
  signed: boolean;
  transaction: Transaction | undefined | null;
  status: TransactionStatus;
  onChangeTransaction: (a: Transaction) => void;
  onTransactionError: (a: Error) => void;
  onOperationBroadcasted: (a: Operation) => void;
  setSigned: (a: boolean) => void;
  bridgePending: boolean;
};
export type St = Step<StepId, StepProps>;
