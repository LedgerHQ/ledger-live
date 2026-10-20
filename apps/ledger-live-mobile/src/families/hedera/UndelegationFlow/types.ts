import type {
  HederaEnrichedDelegation,
  HederaGenericTransaction,
  TransactionStatus,
} from "@ledgerhq/live-common/families/hedera/types";
import type { ParamListBase, RouteProp } from "@react-navigation/native";
import type { Operation } from "@ledgerhq/types-live";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import { ScreenName } from "~/const";

export type HederaUndelegationFlowParamList = {
  [ScreenName.HederaUndelegationAmount]: {
    accountId: string;
    enrichedDelegation: HederaEnrichedDelegation;
    parentId?: string;
    source?: RouteProp<ParamListBase, ScreenName>;
  };
  [ScreenName.HederaUndelegationSelectDevice]: {
    device?: Device;
    accountId: string;
    parentId?: string;
    transaction: HederaGenericTransaction;
    status: TransactionStatus;
    source?: RouteProp<ParamListBase, ScreenName>;
  };
  [ScreenName.HederaUndelegationConnectDevice]: {
    device: Device;
    accountId: string;
    parentId?: string;
    transaction?: HederaGenericTransaction;
    status?: TransactionStatus;
    appName?: string;
    selectDeviceLink?: boolean;
    onSuccess?: (payload: unknown) => void;
    onError?: (error: Error) => void;
    analyticsPropertyFlow?: string;
    source?: RouteProp<ParamListBase, ScreenName>;
  };
  [ScreenName.HederaUndelegationValidationError]: {
    accountId: string;
    parentId?: string;
    deviceId: string;
    transaction: HederaGenericTransaction;
    error: Error;
    source?: RouteProp<ParamListBase, ScreenName>;
  };
  [ScreenName.HederaUndelegationValidationSuccess]: {
    accountId: string;
    parentId?: string;
    deviceId: string;
    transaction: HederaGenericTransaction;
    result: Operation;
    source?: RouteProp<ParamListBase, ScreenName>;
  };
};
