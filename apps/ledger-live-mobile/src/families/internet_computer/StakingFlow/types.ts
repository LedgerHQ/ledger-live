import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import type {
  Transaction,
  TransactionStatus,
} from "@ledgerhq/live-common/families/internet_computer/types";
import type { Operation } from "@ledgerhq/types-live";
import { ParamListBase, RouteProp } from "@react-navigation/native";
import { ScreenName } from "~/const";

/**
 * Creating a neuron is a ledger transfer to a governance subaccount, so this flow is shaped like a
 * send: pick an amount, sign, done. There is no validator to choose — prepareTransaction derives
 * the recipient — which is why there is no selection screen between Started and Amount.
 */
export type InternetComputerStakingFlowParamList = {
  [ScreenName.InternetComputerStakingStarted]: {
    accountId: string;
    parentId?: string;
    source?: RouteProp<ParamListBase, ScreenName>;
  };
  [ScreenName.InternetComputerStakingAmount]: {
    accountId: string;
    parentId?: string;
    transaction: Transaction;
    status?: TransactionStatus;
    source?: RouteProp<ParamListBase, ScreenName>;
  };
  [ScreenName.InternetComputerStakingSelectDevice]: {
    accountId: string;
    parentId?: string;
    transaction: Transaction;
    status?: TransactionStatus;
    device?: Device;
    source?: RouteProp<ParamListBase, ScreenName>;
  };
  [ScreenName.InternetComputerStakingConnectDevice]: {
    accountId: string;
    parentId?: string;
    transaction: Transaction;
    status?: TransactionStatus;
    device: Device;
    appName?: string;
    selectDeviceLink?: boolean;
    analyticsPropertyFlow?: string;
    source?: RouteProp<ParamListBase, ScreenName>;
  };
  [ScreenName.InternetComputerStakingValidationSuccess]: {
    accountId: string;
    parentId?: string;
    deviceId?: string;
    transaction: Transaction;
    result: Operation;
    source?: RouteProp<ParamListBase, ScreenName>;
  };
  [ScreenName.InternetComputerStakingValidationError]: {
    accountId: string;
    parentId?: string;
    deviceId?: string;
    transaction: Transaction;
    error: Error;
    source?: RouteProp<ParamListBase, ScreenName>;
  };
};
