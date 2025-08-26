import BigNumber from "bignumber.js";
import type {
  SuiValidator,
  Transaction,
  TransactionStatus,
} from "@ledgerhq/live-common/families/sui/types";
import type { Operation } from "@ledgerhq/types-live";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import { ScreenName } from "~/const";
import { ParamListBase, RouteProp } from "@react-navigation/native";

export type SuiStakingFlowParamList = {
  [ScreenName.SuiStakingValidator]: {
    accountId: string;
    validator?: SuiValidator;
    transaction?: Transaction;
    fromSelectAmount?: boolean;
    source?: RouteProp<ParamListBase, ScreenName>;
    skipStartedStep?: boolean;
  };
  [ScreenName.SuiStakingValidatorSelect]: {
    accountId: string;
    transaction?: Transaction;
    validator?: SuiValidator;
    source?: RouteProp<ParamListBase, ScreenName>;
  };
  [ScreenName.SuiStakingAmount]: {
    accountId: string;
    transaction: Transaction;
    max?: BigNumber;
    value?: BigNumber;
    nextScreen: string;
    updateTransaction?: (updater: (arg0: Transaction) => Transaction) => void;
    bridgePending?: boolean;
    status?: TransactionStatus;
    validator: SuiValidator;
    source?: RouteProp<ParamListBase, ScreenName>;
  };
  [ScreenName.SuiStakingSelectDevice]: {
    accountId: string;
    parentId?: string;
    transaction?: Transaction;
    status?: TransactionStatus;
    source?: RouteProp<ParamListBase, ScreenName>;
  };
  [ScreenName.SuiStakingConnectDevice]: {
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
  [ScreenName.SuiStakingValidationError]: {
    accountId: string;
    transaction: Transaction;
    error: Error;
    source?: RouteProp<ParamListBase, ScreenName>;
  };
  [ScreenName.SuiStakingValidationSuccess]: {
    accountId: string;
    result: Operation;
    transaction: Transaction;
    source?: RouteProp<ParamListBase, ScreenName>;
  };
};
