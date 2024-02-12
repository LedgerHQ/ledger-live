import type {
  CosmosValidatorItem,
  Transaction,
  TransactionStatus,
} from "@ledgerhq/live-common/families/cosmos/types";
import type { Operation } from "@ledgerhq/types-live";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import { ParamListBase, RouteProp } from "@react-navigation/native";
import { BigNumber } from "bignumber.js";
import { ScreenName } from "~/const";

export type CosmosRedelegationFlowParamList = {
  [ScreenName.CosmosRedelegationValidator]: {
    accountId: string;
    validator?: CosmosValidatorItem;
    validatorSrcAddress: string;
    transaction?: Transaction;
    fromSelectAmount?: boolean;
    source?: RouteProp<ParamListBase, ScreenName>;
  };
  [ScreenName.CosmosDefaultRedelegationAmount]: {
    accountId: string;
    transaction: Transaction;
    status: TransactionStatus;
    validator: CosmosValidatorItem;
    validatorSrc?: CosmosValidatorItem;
    min?: BigNumber;
    max?: BigNumber;
    value?: BigNumber;
    redelegatedBalance?: BigNumber;
    mode?: string;
    nextScreen: ScreenName.CosmosRedelegationValidator | ScreenName.CosmosRedelegationSelectDevice;
    source?: RouteProp<ParamListBase, ScreenName>;
  };
  [ScreenName.CosmosRedelegationAmount]: {
    accountId: string;
    transaction: Transaction;
    status: TransactionStatus;
    validator: CosmosValidatorItem;
    validatorSrc?: CosmosValidatorItem;
    min?: BigNumber;
    max?: BigNumber;
    value?: BigNumber;
    redelegatedBalance?: BigNumber;
    mode?: string;
    nextScreen: ScreenName.CosmosRedelegationValidator | ScreenName.CosmosRedelegationSelectDevice;
    source?: RouteProp<ParamListBase, ScreenName>;
  };
  [ScreenName.CosmosRedelegationSelectDevice]: {
    accountId: string;
    parentId?: string;
    transaction?: Transaction;
    status?: TransactionStatus;
    validatorName: CosmosValidatorItem["name"];
    source?: RouteProp<ParamListBase, ScreenName>;
  };
  [ScreenName.CosmosRedelegationConnectDevice]: {
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
  [ScreenName.CosmosRedelegationValidationError]: {
    accountId: string;
    deviceId: string;
    transaction: Transaction;
    error: Error;
    source?: RouteProp<ParamListBase, ScreenName>;
  };
  [ScreenName.CosmosRedelegationValidationSuccess]: {
    accountId: string;
    deviceId: string;
    transaction: Transaction;
    result: Operation;
    validatorName: CosmosValidatorItem["name"];
    source?: RouteProp<ParamListBase, ScreenName>;
  };
};
