import type { Operation } from "@ledgerhq/types-live";
import type { Transaction, TransactionStatus } from "@ledgerhq/live-common/families/stacks/types";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import type { ParamListBase, RouteProp } from "@react-navigation/native";
import { ScreenName } from "~/const";

export type StacksStakingFlowParamList = {
  [ScreenName.StacksStakingPool]: {
    accountId: string;
    parentId?: string;
    valAddress?: string;
    numCycles?: number;
    source?: RouteProp<ParamListBase, ScreenName>;
  };
  [ScreenName.StacksStakingAmount]: {
    accountId: string;
    parentId?: string;
    valAddress: string;
    numCycles: number;
    source?: RouteProp<ParamListBase, ScreenName>;
  };
  [ScreenName.StacksStakingSelectDevice]: {
    accountId: string;
    parentId?: string;
    transaction?: Transaction;
    status?: TransactionStatus;
    source?: RouteProp<ParamListBase, ScreenName>;
  };
  [ScreenName.StacksStakingConnectDevice]: {
    device?: Device;
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
  [ScreenName.StacksStakingValidationSuccess]: {
    accountId: string;
    parentId?: string;
    transaction: Transaction;
    result: Operation;
    source?: RouteProp<ParamListBase, ScreenName>;
  };
  [ScreenName.StacksStakingValidationError]: {
    accountId: string;
    parentId?: string;
    error: Error;
  };
};
