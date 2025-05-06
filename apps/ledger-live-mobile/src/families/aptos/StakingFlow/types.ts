import BigNumber from "bignumber.js";
import type {
  AptosValidator,
  Transaction,
  TransactionStatus,
} from "@ledgerhq/live-common/families/aptos/types";
import type { Operation } from "@ledgerhq/types-live";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import { ScreenName } from "~/const";
import { ParamListBase, RouteProp } from "@react-navigation/native";

export type AptosStakingFlowParamList = {
  [ScreenName.AptosStakingStarted]: {
    accountId: string;
    source?: RouteProp<ParamListBase, ScreenName>;
  };
  [ScreenName.AptosStakingValidator]: {
    accountId: string;
    validator?: AptosValidator;
    transaction?: Transaction;
    fromSelectAmount?: boolean;
    source?: RouteProp<ParamListBase, ScreenName>;
    skipStartedStep?: boolean;
  };
  [ScreenName.AptosStakingValidatorSelect]: {
    accountId: string;
    transaction?: Transaction;
    validator?: AptosValidator;
    source?: RouteProp<ParamListBase, ScreenName>;
  };
  [ScreenName.AptosStakingAmount]: {
    accountId: string;
    transaction: Transaction;
    max?: BigNumber;
    value?: BigNumber;
    nextScreen: string;
    updateTransaction?: (updater: (arg0: Transaction) => Transaction) => void;
    bridgePending?: boolean;
    status?: TransactionStatus;
    validator: AptosValidator;
    source?: RouteProp<ParamListBase, ScreenName>;
  };
  [ScreenName.AptosStakingSelectDevice]: {
    accountId: string;
    parentId?: string;
    transaction?: Transaction;
    status?: TransactionStatus;
    source?: RouteProp<ParamListBase, ScreenName>;
  };
  [ScreenName.AptosStakingConnectDevice]: {
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
  [ScreenName.AptosStakingValidationError]: {
    accountId: string;
    transaction: Transaction;
    error: Error;
    source?: RouteProp<ParamListBase, ScreenName>;
  };
  [ScreenName.AptosStakingValidationSuccess]: {
    accountId: string;
    result: Operation;
    transaction: Transaction;
    source?: RouteProp<ParamListBase, ScreenName>;
  };
};
