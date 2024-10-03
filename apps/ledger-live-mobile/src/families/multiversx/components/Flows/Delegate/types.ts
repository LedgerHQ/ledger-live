import type { Operation } from "@ledgerhq/types-live";
import type { Transaction } from "@ledgerhq/live-common/generated/types";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import type {
  MultiversXAccount,
  MultiversXProvider,
  TransactionStatus,
} from "@ledgerhq/live-common/families/multiversx/types";
import type { ScreenName } from "~/const";
import { ParamListBase, RouteProp } from "@react-navigation/native";

export type MultiversXDelegationFlowParamList = {
  [ScreenName.MultiversXDelegationStarted]: {
    validators: MultiversXProvider[];
    account: MultiversXAccount;
    source?: RouteProp<ParamListBase, ScreenName>;
  };
  [ScreenName.MultiversXDelegationValidator]: {
    validators: MultiversXProvider[];
    account: MultiversXAccount;
    transaction?: Transaction;
    source?: RouteProp<ParamListBase, ScreenName>;
    skipStartedStep?: boolean;
  };
  [ScreenName.MultiversXDelegationValidatorList]: {
    transaction: Transaction | null | undefined;
    validators: MultiversXProvider[];
    account: MultiversXAccount;
    source?: RouteProp<ParamListBase, ScreenName>;
  };
  [ScreenName.MultiversXDelegationAmount]: {
    transaction: Transaction;
    validators: MultiversXProvider[];
    account: MultiversXAccount;
    validatorName: string;
    source?: RouteProp<ParamListBase, ScreenName>;
  };
  [ScreenName.MultiversXDelegationSelectDevice]: {
    accountId: string;
    parentId?: string;
    transaction?: Transaction | null | undefined;
    status?: TransactionStatus;
    validators: MultiversXProvider[];
    source?: RouteProp<ParamListBase, ScreenName>;
  };
  [ScreenName.MultiversXDelegationConnectDevice]: {
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
    validators: MultiversXProvider[];
    source?: RouteProp<ParamListBase, ScreenName>;
  };
  [ScreenName.MultiversXDelegationValidationError]: {
    accountId: string;
    deviceId: string;
    transaction: Transaction;
    error: Error;
    source?: RouteProp<ParamListBase, ScreenName>;
  };
  [ScreenName.MultiversXDelegationValidationSuccess]: {
    accountId: string;
    deviceId: string;
    transaction: Transaction;
    result: Operation;
    validators: MultiversXProvider[];
    source?: RouteProp<ParamListBase, ScreenName>;
  };
};
