import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import type { KNOWN_TOPICS } from "@ledgerhq/live-common/families/internet_computer/consts";
import type {
  ICPAccount,
  ICPNeuron,
  ICPTransactionType,
  InternetComputerOperation,
  Transaction,
  TransactionStatus,
} from "@ledgerhq/live-common/families/internet_computer/types";
import type { OpenModal } from "~/renderer/actions/modals";
import type { Step as StepperStep } from "~/renderer/components/Stepper";

export type StepId =
  | "device"
  | "listNeuron"
  | "manage"
  | "manageAction"
  | "followTopic"
  | "selectFollowees"
  | "setDissolveDelay"
  | "stakeMaturity"
  | "splitNeuron"
  | "addHotKey"
  | "confirmation";

export type FollowTopic = keyof typeof KNOWN_TOPICS;

export type StepProps = {
  transitionTo: (step: StepId) => void;
  device: Device | undefined | null;
  account: ICPAccount;
  parentAccount: null;
  transaction: Transaction | undefined | null;
  status: TransactionStatus;
  bridgePending: boolean;
  error: Error | undefined | null;
  optimisticOperation: InternetComputerOperation | undefined | null;
  signed: boolean;
  onClose: () => void;
  openModal: OpenModal;
  onChangeTransaction: (transaction: Transaction) => void;
  onUpdateTransaction: (updater: (transaction: Transaction) => Transaction) => void;
  onTransactionError: (error: Error) => void;
  onOperationBroadcasted: (operation: InternetComputerOperation) => void;
  /** Discards the previous attempt's outcome — both on Retry and when a new action starts. */
  resetAttempt: () => void;
  setSigned: (signed: boolean) => void;

  // The neurons the flow is working from: the account's snapshot until a list_neurons operation
  // broadcasts a fresher one, which the flow shows before the account has finished syncing.
  neurons: readonly ICPNeuron[];
  lastUpdatedMSecs: number;
  // Identifies the neuron under management. Deliberately an id and not a list index: a refresh can
  // reorder or drop neurons, which would silently repoint an index at a different neuron.
  selectedNeuronId: string | null;
  setSelectedNeuronId: (neuronId: string | null) => void;
  // The operation the device is about to sign, so the confirmation step can name what happened.
  lastAction: ICPTransactionType | null;
  setLastAction: (action: ICPTransactionType | null) => void;
  // The followee id being typed. Held here because the footer that gates Continue on it is a
  // sibling of the step holding the field.
  followeeDraft: string;
  setFolloweeDraft: (draft: string) => void;
};

export type Step = StepperStep<StepId, StepProps>;
