// @flow

import type { TFunction } from "react-i18next";
import type { Account, Operation } from "@ledgerhq/types-live";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import type { Transaction, StakeType, StakeMethod } from "@ledgerhq/live-common/families/hedera/types";
import type { Step } from "~/renderer/components/Stepper";
import type { Option } from "~/renderer/components/Select";
import { TransactionStatus } from "@ledgerhq/live-common/generated/types";

export type StepId = "stake" | "summary" | "connectDevice" | "success";

// `StepProps` is shared amongst `StakeModal` and `StopStakingModal`
export type StepProps = {
  t: TFunction,
  transitionTo: (a: string) => void,
  device: Device | undefined | null,
  account: Account | undefined | null,
  parentAccount: Account | undefined | null,
  onRetry: (a: void) => void,
  onClose: () => void,
  openModal: (key: string, config?: any) => void,
  optimisticOperation: any,
  continueClicked: boolean,
  setContinueClicked: (a: boolean) => void,
  error: any,
  warning: any,
  signed: boolean,
  transaction: Transaction | undefined | null,
  status: TransactionStatus,
  onChangeTransaction: (a: Transaction) => void,
  onUpdateTransaction: (a:(b: Transaction) => Transaction) => void,
  onTransactionError: (a: Error) => void,
  onOperationBroadcasted: (a: Operation) => void,
  setSigned: (a: boolean) => void,
  bridgePending: boolean,
  nodeListOptions: (Option[]) | undefined | null,
  stakeType: StakeType | undefined | null,
  name: string,
  stakeMethod: StakeMethod | undefined | null,
  setStakeMethod: (a: string) => void,

  onConfirmationHandler: Function,
  onFailHandler: Function,
};

export type St = Step<StepId, StepProps>;