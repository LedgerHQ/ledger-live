import type {
  Transaction,
  TransactionStatus,
} from "@ledgerhq/live-common/families/internet_computer/types";
import type { Operation } from "@ledgerhq/types-live";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import { KNOWN_TOPICS } from "@ledgerhq/live-common/families/internet_computer/consts";
import { ScreenName } from "~/const";
import { ParamListBase, RouteProp } from "@react-navigation/native";

export type KnownTopic = keyof typeof KNOWN_TOPICS;

export type NeuronActionType =
  | "increase_stake"
  | "start_dissolving"
  | "stop_dissolving"
  | "disburse"
  | "spawn_neuron"
  | "split_neuron"
  | "stake_maturity"
  | "set_dissolve_delay"
  | "add_hot_key"
  | "remove_hot_key"
  | "auto_stake_maturity"
  | "refresh_voting_power"
  | "follow";

export type InternetComputerNeuronManageFlowParamList = {
  [ScreenName.InternetComputerNeuronList]: {
    accountId: string;
    source?: RouteProp<ParamListBase, ScreenName>;
  };
  [ScreenName.InternetComputerNeuronAction]: {
    accountId: string;
    neuronId: string;
    actionType: NeuronActionType;
    autoStakeMaturity?: boolean;
    transaction?: Transaction;
    source?: RouteProp<ParamListBase, ScreenName>;
  };
  [ScreenName.InternetComputerNeuronSetDissolveDelay]: {
    accountId: string;
    neuronId: string;
    source?: RouteProp<ParamListBase, ScreenName>;
  };
  [ScreenName.InternetComputerNeuronAddHotKey]: {
    accountId: string;
    neuronId: string;
    source?: RouteProp<ParamListBase, ScreenName>;
  };
  [ScreenName.InternetComputerNeuronRemoveHotKey]: {
    accountId: string;
    neuronId: string;
    source?: RouteProp<ParamListBase, ScreenName>;
  };
  [ScreenName.InternetComputerNeuronStakeMaturity]: {
    accountId: string;
    neuronId: string;
    source?: RouteProp<ParamListBase, ScreenName>;
  };
  [ScreenName.InternetComputerNeuronFollowSelectTopic]: {
    accountId: string;
    neuronId: string;
    source?: RouteProp<ParamListBase, ScreenName>;
  };
  [ScreenName.InternetComputerNeuronFollowSelectFollowees]: {
    accountId: string;
    neuronId: string;
    followTopic: KnownTopic;
    source?: RouteProp<ParamListBase, ScreenName>;
  };
  [ScreenName.InternetComputerNeuronConfirmFollowingList]: {
    accountId: string;
    source?: RouteProp<ParamListBase, ScreenName>;
  };
  [ScreenName.InternetComputerNeuronSelectDevice]: {
    accountId: string;
    parentId?: string;
    transaction?: Transaction;
    status?: TransactionStatus;
    source?: RouteProp<ParamListBase, ScreenName>;
  };
  [ScreenName.InternetComputerNeuronConnectDevice]: {
    device: Device;
    accountId: string;
    parentId?: string;
    transaction: Transaction;
    status: TransactionStatus;
    appName?: string;
    selectDeviceLink?: boolean;
    onSuccess?: (payload: unknown) => void;
    onError?: (error: Error) => void;
    analyticsPropertyFlow?: string;
    forceSelectDevice?: boolean;
    source?: RouteProp<ParamListBase, ScreenName>;
  };
  [ScreenName.InternetComputerNeuronValidationError]: {
    accountId: string;
    transaction: Transaction;
    error: Error;
    source?: RouteProp<ParamListBase, ScreenName>;
  };
  [ScreenName.InternetComputerNeuronValidationSuccess]: {
    accountId: string;
    result?: Operation;
    transaction: Transaction;
    source?: RouteProp<ParamListBase, ScreenName>;
  };
};
