// @flow
import type { TFunction } from "react-i18next";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import type { Account, TransactionStatus, Operation } from "@ledgerhq/types-live";
import type { Transaction } from "@ledgerhq/live-common/families/celo/types";

export type CoreStakingFlowModalStepProps = {
  t: TFunction,
  transitionTo: (string: string) => void,
  device: ?Device,
  account: ?Account,
  parentAccount: ?Account,
  onRetry: void => void,
  onClose: () => void,
  openModal: (key: string, config?: any) => void,
  optimisticOperation: *,
  error: *,
  warning: *,
  signed: boolean,
  transaction: ?Transaction,
  status: TransactionStatus,
  onChangeTransaction: Transaction => void,
  onUpdateTransaction: ((Transaction) => Transaction) => void,
  onTransactionError: Error => void,
  onOperationBroadcasted: Operation => void,
  setSigned: boolean => void,
  bridgePending: boolean,
};
