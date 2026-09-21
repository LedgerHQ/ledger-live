import type { Operation } from "@ledgerhq/types-live";
import type { Transaction, TransactionStatus } from "@ledgerhq/live-common/families/aleo/types";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import type { ParamListBase, RouteProp } from "@react-navigation/native";
import { ScreenName } from "~/const";

export type AleoBondPublicFlowParamList = {
  [ScreenName.AleoBondPublicSelectValidator]: {
    accountId: string;
    parentId?: string;
    validatorAddress?: string;
    source?: RouteProp<ParamListBase, ScreenName>;
  };
  [ScreenName.AleoBondPublicAmount]: {
    accountId: string;
    parentId?: string;
    validatorAddress: string;
    source?: RouteProp<ParamListBase, ScreenName>;
  };
  [ScreenName.AleoBondPublicSelectDevice]: {
    accountId: string;
    parentId?: string;
    transaction?: Transaction;
    status?: TransactionStatus;
    source?: RouteProp<ParamListBase, ScreenName>;
  };
  [ScreenName.AleoBondPublicConnectDevice]: {
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
  };
  [ScreenName.AleoBondPublicValidationSuccess]: {
    accountId: string;
    parentId?: string;
    transaction: Transaction;
    result: Operation;
    source?: RouteProp<ParamListBase, ScreenName>;
  };
  [ScreenName.AleoBondPublicValidationError]: {
    accountId: string;
    parentId?: string;
    error: Error;
  };
};
