import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { Step } from "~/renderer/components/Stepper";
import {
  Transaction,
  TransactionStatus,
  ICPAccount,
  InternetComputerOperation,
  ICPTransactionType,
} from "@ledgerhq/live-common/families/internet_computer/types";
import { OpenModal } from "~/renderer/actions/modals";
import { NeuronsData } from "@ledgerhq/live-common/families/internet_computer/utils";
import { KNOWN_TOPICS } from "@ledgerhq/live-common/families/internet_computer/consts";

export type StepId =
  | "device"
  | "listNeuron"
  | "confirmation"
  | "manage"
  | "manageAction"
  | "followTopic"
  | "selectFollowees"
  | "setDissolveDelay"
  | "stakeMaturity"
  | "splitNeuron"
  | "addHotKey";

export type StepProps = {
  lastManageAction?: ICPTransactionType;
  setLastManageAction: (a: ICPTransactionType) => void;
  transitionTo: (address: string) => void;
  device: Device | undefined | null;
  account: ICPAccount;
  parentAccount: never;
  onRetry: () => void;
  onClose: () => void;
  openModal: OpenModal;
  optimisticOperation: InternetComputerOperation | undefined;
  error: Error | undefined;
  signed: boolean;
  neurons: NeuronsData;
  needsRefresh: boolean;
  setNeedsRefresh: (needsRefresh: boolean) => void;
  manageNeuronIndex: number;
  setManageNeuronIndex: (index: number) => void;
  transaction: Transaction | undefined | null;
  onStepChange: ({ id }: St) => void;
  status: TransactionStatus;
  onChangeTransaction: (tx: Transaction) => void;
  onUpdateTransaction: (a: (tx: Transaction) => Transaction) => void;
  onTransactionError: (error: Error) => void;
  onOperationBroadcasted: (operation: InternetComputerOperation) => void;
  setSigned: (signed: boolean) => void;
  bridgePending: boolean;
  validatorAddress: string;
  followTopic: keyof typeof KNOWN_TOPICS;
  setFollowTopic: (topic: keyof typeof KNOWN_TOPICS) => void;
};
export type St = Step<StepId, StepProps>;
