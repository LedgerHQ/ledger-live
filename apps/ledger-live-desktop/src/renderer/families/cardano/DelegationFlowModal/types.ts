import { TFunction } from "react-i18next";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { Step } from "~/renderer/components/Stepper";
import { Operation } from "@ledgerhq/types-live";
import * as CardanoTypes from "@ledgerhq/live-common/families/cardano/types";
import { StakePool } from "@ledgerhq/live-common/families/cardano/api/api-types";

export type StepId = "validator" | "summary" | "connectDevice" | "confirmation";

export type StepProps = {
  t: TFunction;
  transitionTo: (a: string) => void;
  device: Device | undefined | null;
  account: CardanoTypes.CardanoAccount | undefined | null;
  parentAccount: CardanoTypes.CardanoAccount | undefined | null;
  onRetry: (a: void) => void;
  onClose: () => void;
  openModal: (key: string, config?: any) => void;
  optimisticOperation: any;
  error: any;
  signed: boolean;
  transaction: CardanoTypes.Transaction | undefined | null;
  status: CardanoTypes.TransactionStatus;
  onChangeTransaction: (a: CardanoTypes.Transaction) => void;
  onUpdateTransaction: (a: (a: CardanoTypes.Transaction) => CardanoTypes.Transaction) => void;
  onTransactionError: (a: Error) => void;
  onOperationBroadcasted: (a: Operation) => void;
  setSigned: (a: boolean) => void;
  bridgePending: boolean;
  selectedPool: StakePool;
  setSelectedPool: (a: StakePool) => void;
};

export type St = Step<StepId, StepProps>;
