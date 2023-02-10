// @flow

import type { TFunction } from "react-i18next";
import type { Account, AccountLike, Operation, TransactionCommonRaw } from "@ledgerhq/types-live";
import type { Transaction, TransactionStatus } from "@ledgerhq/live-common/generated/types";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import type { Step } from "~/renderer/components/Stepper";

export type StepId = "method" | "fees" | "summary" | "device" | "confirmation";

export type StepProps = {
  t: TFunction,
  transitionTo: string => void,
  device: ?Device,
  account: ?AccountLike,
  parentAccount: ?Account,
  transaction: ?Transaction,
  status: TransactionStatus,
  bridgePending: boolean,
  error: ?Error,
  optimisticOperation: ?Operation,
  closeModal: void => void,
  openModal: (string, any) => void,
  onChangeTransaction: Transaction => void,
  onTransactionError: Error => void,
  onOperationBroadcasted: Operation => void,
  onRetry: void => void,
  setSigned: boolean => void,
  signed: boolean,
  updateTransaction: (updater: any) => void,
  onConfirmationHandler: Function,
  onFailHandler: Function,
  currencyName: ?string,
  transactionRaw: TransactionCommonRaw,
  transactionSequenceNumber: number,
  isNftOperation: boolean,
};

export type St = Step<StepId, StepProps>;
