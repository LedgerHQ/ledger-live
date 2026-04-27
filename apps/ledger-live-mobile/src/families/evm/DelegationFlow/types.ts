import type {
  Transaction,
  TransactionStatus,
  StakingValidatorItem,
} from "@ledgerhq/coin-evm/types/index";
import type { Operation } from "@ledgerhq/types-live";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import { ParamListBase, RouteProp } from "@react-navigation/native";
import { ScreenName } from "~/const";

export type EvmDelegationFlowParamList = {
  [ScreenName.EvmDelegationStarted]: {
    accountId: string;
    source?: RouteProp<ParamListBase, ScreenName>;
  };
  [ScreenName.EvmDelegationValidatorSelect]: {
    accountId: string;
    validator?: StakingValidatorItem;
    transaction?: Transaction;
    source?: RouteProp<ParamListBase, ScreenName>;
  };
  [ScreenName.EvmDelegationSelectDevice]: {
    accountId: string;
    parentId?: string;
    transaction?: Transaction;
    status?: TransactionStatus;
    validatorName?: string;
    source?: RouteProp<ParamListBase, ScreenName>;
  };
  [ScreenName.EvmDelegationConnectDevice]: {
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
  [ScreenName.EvmDelegationValidationError]: {
    accountId: string;
    deviceId: string;
    transaction: Transaction;
    error: Error;
    source?: RouteProp<ParamListBase, ScreenName>;
  };
  [ScreenName.EvmDelegationValidationSuccess]: {
    accountId: string;
    deviceId: string;
    transaction: Transaction;
    result: Operation;
    validatorName?: string;
    source?: RouteProp<ParamListBase, ScreenName>;
  };
};
