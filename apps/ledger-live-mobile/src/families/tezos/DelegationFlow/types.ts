import type { Transaction, TransactionStatus } from "@ledgerhq/live-common/families/tezos/types";
import type { Operation } from "@ledgerhq/types-live";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import { ParamListBase, RouteProp } from "@react-navigation/native";
import { ScreenName } from "~/const";

export type TezosDelegationFlowParamList = {
  [ScreenName.TezosEarnRewards]: {
    accountId: string;
    parentId?: string;
    source?: RouteProp<ParamListBase, ScreenName>;
  };
  [ScreenName.DelegationStarted]: {
    accountId: string;
    parentId?: string;
    source?: RouteProp<ParamListBase, ScreenName>;
  };
  [ScreenName.DelegationSummary]: {
    mode?: "delegate" | "undelegate";
    stakeAfter?: boolean;
    accountId: string;
    parentId?: string;
    transaction?: Transaction;
    status?: TransactionStatus;
    source?: RouteProp<ParamListBase, ScreenName>;
  };
  [ScreenName.DelegationSelectValidator]: {
    accountId: string;
    parentId?: string;
    transaction: Transaction;
    status: TransactionStatus;
    source?: RouteProp<ParamListBase, ScreenName>;
  };
  [ScreenName.DelegationConnectDevice]: {
    device: Device;
    accountId: string;
    parentId?: string;
    transaction?: Transaction;
    status?: TransactionStatus;
    appName?: string;
    selectDeviceLink?: boolean;
    stakeAfter?: boolean;
    onSuccess?: (payload: unknown) => void;
    onError?: (error: Error) => void;
    analyticsPropertyFlow?: string;
    source?: RouteProp<ParamListBase, ScreenName>;
  };
  [ScreenName.DelegationSelectDevice]: {
    device?: Device;
    parentId?: string;
    accountId: string;
    stakeAfter?: boolean;
    transaction: Transaction;
    status: TransactionStatus;
    source?: RouteProp<ParamListBase, ScreenName>;
  };
  [ScreenName.DelegationValidationSuccess]: {
    accountId: string;
    parentId?: string;
    deviceId: string;
    transaction: Transaction;
    result: Operation;
    stakeAfter?: boolean;
    source?: RouteProp<ParamListBase, ScreenName>;
  };
  [ScreenName.DelegationValidationError]: {
    accountId: string;
    parentId?: string;
    deviceId: string;
    transaction: Transaction;
    error: Error;
  };
};
