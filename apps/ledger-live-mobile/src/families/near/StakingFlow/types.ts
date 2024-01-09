import BigNumber from "bignumber.js";
import type {
  NearValidatorItem,
  Transaction,
  TransactionStatus,
} from "@ledgerhq/live-common/families/near/types";
import type { Operation } from "@ledgerhq/types-live";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import { ScreenName } from "~/const";
import { ParamListBase, RouteProp } from "@react-navigation/native";

export type NearStakingFlowParamList = {
  [ScreenName.NearStakingStarted]: {
    accountId: string;
    source?: RouteProp<ParamListBase, ScreenName>;
  };
  [ScreenName.NearStakingValidator]: {
    accountId: string;
    validator?: NearValidatorItem;
    transaction?: Transaction;
    fromSelectAmount?: boolean;
    source?: RouteProp<ParamListBase, ScreenName>;
  };
  [ScreenName.NearStakingValidatorSelect]: {
    accountId: string;
    transaction?: Transaction;
    validator?: NearValidatorItem;
    source?: RouteProp<ParamListBase, ScreenName>;
  };
  [ScreenName.NearStakingAmount]: {
    accountId: string;
    transaction: Transaction;
    max?: BigNumber;
    value?: BigNumber;
    nextScreen: string;
    updateTransaction?: (updater: (arg0: Transaction) => Transaction) => void;
    bridgePending?: boolean;
    status?: TransactionStatus;
    validator: NearValidatorItem;
    source?: RouteProp<ParamListBase, ScreenName>;
  };
  [ScreenName.NearStakingSelectDevice]: {
    accountId: string;
    parentId?: string;
    transaction?: Transaction;
    status?: TransactionStatus;
    source?: RouteProp<ParamListBase, ScreenName>;
  };
  [ScreenName.NearStakingConnectDevice]: {
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
  [ScreenName.NearStakingValidationError]: {
    accountId: string;
    transaction: Transaction;
    error: Error;
    source?: RouteProp<ParamListBase, ScreenName>;
  };
  [ScreenName.NearStakingValidationSuccess]: {
    accountId: string;
    result: Operation;
    transaction: Transaction;
    source?: RouteProp<ParamListBase, ScreenName>;
  };
};
