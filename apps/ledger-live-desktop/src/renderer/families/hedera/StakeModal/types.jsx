// @flow

import type { TFunction } from "react-i18next";
import type { Account, TransactionStatus, Operation } from "@ledgerhq/types-live";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import type { Transaction, StakeType } from "@ledgerhq/live-common/families/hedera/types";
import type { Step } from "~/renderer/components/Stepper";
import type { Option } from "~/renderer/components/Select";

export type StepId = "stake" | "summary" | "connectDevice" | "success";

// `StepProps` is shared amongst `StakeModal` and `StopStakingModal`
export type StepProps = {
  t: TFunction,
  transitionTo: string => void,
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
  nodeListOptions: ?(Option[]),
  stakeType: ?StakeType,
  name: string,

  onConfirmationHandler: Function,
  onFailHandler: Function,
};

export type St = Step<StepId, StepProps>;