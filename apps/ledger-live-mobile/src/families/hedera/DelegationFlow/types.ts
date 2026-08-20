import type {
  HederaGenericTransaction,
  HederaValidator,
  TransactionStatus,
} from "@ledgerhq/live-common/families/hedera/types";
import type { ParamListBase, RouteProp } from "@react-navigation/native";
import type { Operation } from "@ledgerhq/types-live";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import { ScreenName } from "~/const";

export type HederaDelegationFlowParamList = {
  [ScreenName.HederaDelegationSummary]: {
    accountId: string;
    parentId?: string;
    validator?: HederaValidator;
    source?: RouteProp<ParamListBase, ScreenName>;
  };
  [ScreenName.HederaDelegationSelectValidator]: {
    accountId: string;
    parentId?: string;
    source?: RouteProp<ParamListBase, ScreenName>;
  };
  [ScreenName.HederaDelegationSelectDevice]: {
    device?: Device;
    accountId: string;
    parentId?: string;
    transaction: HederaGenericTransaction;
    status: TransactionStatus;
    source?: RouteProp<ParamListBase, ScreenName>;
  };
  [ScreenName.HederaDelegationConnectDevice]: {
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
  [ScreenName.HederaDelegationValidationError]: {
    accountId: string;
    parentId?: string;
    deviceId: string;
    transaction: HederaGenericTransaction;
    error: Error;
    source?: RouteProp<ParamListBase, ScreenName>;
  };
  [ScreenName.HederaDelegationValidationSuccess]: {
    accountId: string;
    parentId?: string;
    deviceId: string;
    transaction: HederaGenericTransaction;
    result: Operation;
    source?: RouteProp<ParamListBase, ScreenName>;
  };
};
