import { TFunction } from "i18next";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { Step } from "~/renderer/components/Stepper";
import type { StakingAccount } from "@ledgerhq/live-common/families/evm/staking/types";
import type { GenericTransaction } from "@ledgerhq/live-common/bridge/generic-alpaca/types";
import { TransactionStatusCommon, Operation } from "@ledgerhq/types-live";
import { OpenModal } from "~/renderer/actions/modals";

export type StepId = "validator" | "amount" | "connectDevice" | "confirmation";

export type StepProps = {
  t: TFunction;
  transitionTo: (a: string) => void;
  device: Device | undefined | null;
  account: StakingAccount;
  parentAccount: never;
  onRetry: (a: void) => void;
  onClose: () => void;
  openModal: OpenModal;
  optimisticOperation: Operation | undefined;
  error: Error | undefined;
  signed: boolean;
  transaction: GenericTransaction | undefined | null;
  status: TransactionStatusCommon;
  onChangeTransaction: (a: GenericTransaction) => void;
  onUpdateTransaction: (a: (a: GenericTransaction) => GenericTransaction) => void;
  onTransactionError: (a: Error) => void;
  onOperationBroadcasted: (a: Operation) => void;
  setSigned: (a: boolean) => void;
  bridgePending: boolean;
  source?: string;
};

export type St = Step<StepId, StepProps>;
