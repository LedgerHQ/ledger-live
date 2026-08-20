import type {
  HederaEnrichedDelegation,
  HederaGenericTransaction,
  HederaValidator,
  TransactionStatus,
} from "@ledgerhq/live-common/families/hedera/types";
import type { ParamListBase, RouteProp } from "@react-navigation/native";
import type { Operation } from "@ledgerhq/types-live";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import { ScreenName } from "~/const";

export type HederaRedelegationFlowParamList = {
  [ScreenName.HederaRedelegationSelectValidator]: {
    accountId: string;
    parentId?: string;
    enrichedDelegation: HederaEnrichedDelegation;
    source?: RouteProp<ParamListBase, ScreenName>;
  };
  [ScreenName.HederaRedelegationAmount]: {
    accountId: string;
    parentId?: string;
    enrichedDelegation: HederaEnrichedDelegation;
    selectedValidator: HederaValidator;
    source?: RouteProp<ParamListBase, ScreenName>;
  };
  [ScreenName.HederaRedelegationSelectDevice]: {
    device?: Device;
    accountId: string;
    parentId?: string;
    transaction: HederaGenericTransaction;
    status: TransactionStatus;
    source?: RouteProp<ParamListBase, ScreenName>;
  };
  [ScreenName.HederaRedelegationConnectDevice]: {
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
  [ScreenName.HederaRedelegationValidationError]: {
    accountId: string;
    parentId?: string;
    deviceId: string;
    transaction: HederaGenericTransaction;
    error: Error;
    source?: RouteProp<ParamListBase, ScreenName>;
  };
  [ScreenName.HederaRedelegationValidationSuccess]: {
    accountId: string;
    parentId?: string;
    deviceId: string;
    transaction: HederaGenericTransaction;
    result: Operation;
    source?: RouteProp<ParamListBase, ScreenName>;
  };
};
