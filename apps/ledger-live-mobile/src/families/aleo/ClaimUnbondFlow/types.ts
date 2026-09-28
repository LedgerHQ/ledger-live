import type { Operation } from "@ledgerhq/types-live";
import type { Transaction, TransactionStatus } from "@ledgerhq/live-common/families/aleo/types";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import type { ParamListBase, RouteProp } from "@react-navigation/native";
import { ScreenName } from "~/const";

export type AleoClaimUnbondFlowParamList = {
  [ScreenName.AleoClaimUnbondAmount]: {
    accountId: string;
    parentId?: string;
    source?: RouteProp<ParamListBase, ScreenName>;
  };
  [ScreenName.AleoClaimUnbondSelectDevice]: {
    accountId: string;
    parentId?: string;
    transaction?: Transaction;
    status?: TransactionStatus;
    source?: RouteProp<ParamListBase, ScreenName>;
  };
  [ScreenName.AleoClaimUnbondConnectDevice]: {
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
  [ScreenName.AleoClaimUnbondValidationSuccess]: {
    accountId: string;
    parentId?: string;
    transaction: Transaction;
    result: Operation;
    source?: RouteProp<ParamListBase, ScreenName>;
  };
  [ScreenName.AleoClaimUnbondValidationError]: {
    accountId: string;
    parentId?: string;
    error: Error;
  };
};
