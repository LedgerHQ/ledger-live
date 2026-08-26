import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import type { KNOWN_TOPICS } from "@ledgerhq/live-common/families/internet_computer/consts";
import type {
  Transaction,
  TransactionStatus,
} from "@ledgerhq/live-common/families/internet_computer/types";
import type { Operation } from "@ledgerhq/types-live";
import { ParamListBase, RouteProp } from "@react-navigation/native";
import { ScreenName } from "~/const";

export type FollowTopic = keyof typeof KNOWN_TOPICS;

/**
 * Screens address a neuron by id, never by the neuron itself: `ICPNeuron` is full of bigints, which
 * React Navigation cannot serialize, and a `list_neurons` refresh can reorder or drop neurons, so a
 * captured copy would go stale. Each screen re-selects from the account.
 */
type NeuronRoute = {
  accountId: string;
  parentId?: string;
  neuronId: string;
  source?: RouteProp<ParamListBase, ScreenName>;
};

/** Action screens patch the transaction their caller seeded, then hand it to the device screens. */
type NeuronActionRoute = NeuronRoute & {
  transaction: Transaction;
  status?: TransactionStatus;
};

/**
 * The signing tail. `neuronId` is optional here alone: `list_neurons` refreshes the whole account
 * and addresses no single neuron, and every other operation already carries its id on the
 * transaction.
 */
type NeuronSigningRoute = Omit<NeuronActionRoute, "neuronId"> & { neuronId?: string };

export type InternetComputerNeuronManageFlowParamList = {
  [ScreenName.InternetComputerNeuronList]: {
    accountId: string;
    parentId?: string;
    // Set when another flow hands control back, e.g. a top-up that ran through the send flow.
    neuronId?: string;
    source?: RouteProp<ParamListBase, ScreenName>;
  };
  [ScreenName.InternetComputerNeuronDetails]: NeuronRoute;
  [ScreenName.InternetComputerNeuronIncreaseStake]: NeuronActionRoute;
  [ScreenName.InternetComputerNeuronSetDissolveDelay]: NeuronActionRoute;
  [ScreenName.InternetComputerNeuronStakeMaturity]: NeuronActionRoute;
  [ScreenName.InternetComputerNeuronSplit]: NeuronActionRoute;
  [ScreenName.InternetComputerNeuronAddHotKey]: NeuronActionRoute;
  [ScreenName.InternetComputerNeuronFollowTopic]: NeuronActionRoute;
  [ScreenName.InternetComputerNeuronFollowees]: NeuronActionRoute & { followTopic: FollowTopic };
  [ScreenName.InternetComputerNeuronRefreshVotingPower]: {
    accountId: string;
    parentId?: string;
    source?: RouteProp<ParamListBase, ScreenName>;
  };
  [ScreenName.InternetComputerNeuronSelectDevice]: NeuronSigningRoute & { device?: Device };
  [ScreenName.InternetComputerNeuronConnectDevice]: NeuronSigningRoute & {
    device: Device;
    appName?: string;
    selectDeviceLink?: boolean;
    analyticsPropertyFlow?: string;
  };
  [ScreenName.InternetComputerNeuronValidationSuccess]: NeuronSigningRoute & {
    deviceId?: string;
    result: Operation;
  };
  [ScreenName.InternetComputerNeuronValidationError]: NeuronSigningRoute & {
    deviceId?: string;
    error: Error;
    // Whether the device produced a signature: a request that was never sent is always safe to retry.
    signed?: boolean;
  };
};
