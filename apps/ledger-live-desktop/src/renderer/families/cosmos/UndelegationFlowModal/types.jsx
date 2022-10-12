// @flow
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import type { Step } from "~/renderer/components/Stepper";
import type { Account, Operation } from "@ledgerhq/types-live";
import type { Transaction, TransactionStatus } from "@ledgerhq/live-common/families/cosmos/types";

export type StepId = "amount" | "device" | "confirmation";

export type StepProps = {
  transitionTo: (address: string) => void,
  device: ?Device,
  account: ?Account,
  parentAccount: typeof undefined,
  onRetry: () => void,
  onClose: () => void,
  openModal: (key: string, config?: any) => void,
  optimisticOperation: any,
  error: any,
  signed: boolean,
  transaction: ?Transaction,
  status: TransactionStatus,
  onChangeTransaction: (tx: Transaction) => void,
  onUpdateTransaction: ((tx: Transaction) => Transaction) => void,
  onTransactionError: (error: Error) => void,
  onOperationBroadcasted: (operation: Operation) => void,
  setSigned: (signed: boolean) => void,
  bridgePending: boolean,
  validatorAddress: string,
};

export type St = Step<StepId, StepProps>;
