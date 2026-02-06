import BigNumber from "bignumber.js";
import type {
  Transaction,
  TransactionStatus,
} from "@ledgerhq/live-common/families/internet_computer/types";
import type { Operation } from "@ledgerhq/types-live";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import { ScreenName } from "~/const";
import { ParamListBase, RouteProp } from "@react-navigation/native";

export type DissolveDelayPreset = {
  label: string;
  seconds: number;
};

export const DISSOLVE_DELAY_PRESETS: DissolveDelayPreset[] = [
  { label: "6 months", seconds: 15778800 }, // MIN_DISSOLVE_DELAY
  { label: "1 year", seconds: 31557600 },
  { label: "4 years", seconds: 126230400 },
  { label: "8 years", seconds: 252460800 }, // MAX_DISSOLVE_DELAY
];

export type InternetComputerStakingFlowParamList = {
  [ScreenName.InternetComputerStakingStarted]: {
    accountId: string;
    source?: RouteProp<ParamListBase, ScreenName>;
  };
  [ScreenName.InternetComputerStakingAmount]: {
    accountId: string;
    transaction?: Transaction;
    dissolveDelay?: number;
    source?: RouteProp<ParamListBase, ScreenName>;
  };
  [ScreenName.InternetComputerStakingSelectDevice]: {
    accountId: string;
    parentId?: string;
    transaction?: Transaction;
    status?: TransactionStatus;
    source?: RouteProp<ParamListBase, ScreenName>;
  };
  [ScreenName.InternetComputerStakingConnectDevice]: {
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
  [ScreenName.InternetComputerStakingValidationError]: {
    accountId: string;
    transaction: Transaction;
    error: Error;
    source?: RouteProp<ParamListBase, ScreenName>;
  };
  [ScreenName.InternetComputerStakingValidationSuccess]: {
    accountId: string;
    result: Operation;
    transaction: Transaction;
    source?: RouteProp<ParamListBase, ScreenName>;
  };
};
