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

export type CosmosDelegationFlowParamList = {
  [ScreenName.CosmosDelegationStarted]: {
    accountId: string;
    source?: RouteProp<ParamListBase, ScreenName>;
  };
  [ScreenName.CosmosDelegationValidator]: {
    accountId: string;
    validator?: CosmosValidatorItem;
    transaction?: Transaction;
    fromSelectAmount?: boolean;
    source?: RouteProp<ParamListBase, ScreenName>;
  };
  [ScreenName.CosmosDelegationValidatorSelect]: {
    accountId: string;
    validator?: CosmosValidatorItem;
    transaction?: Transaction;
    fromSelectAmount?: boolean;
    source?: RouteProp<ParamListBase, ScreenName>;
  };
  [ScreenName.CosmosDelegationAmount]: {
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
    nextScreen: ScreenName.CosmosDelegationValidator;
    source?: RouteProp<ParamListBase, ScreenName>;
  };
  [ScreenName.CosmosDelegationSelectDevice]: {
    accountId: string;
    parentId?: string;
    transaction?: Transaction;
    status?: TransactionStatus;
    validatorName?: CosmosValidatorItem["name"];
    source?: RouteProp<ParamListBase, ScreenName>;
  };
  [ScreenName.CosmosDelegationConnectDevice]: {
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
  [ScreenName.CosmosDelegationValidationError]: {
    accountId: string;
    deviceId: string;
    transaction: Transaction;
    error: Error;
    source?: RouteProp<ParamListBase, ScreenName>;
  };
  [ScreenName.CosmosDelegationValidationSuccess]: {
    accountId: string;
    deviceId: string;
    transaction: Transaction;
    result: Operation;
    validatorName?: CosmosValidatorItem["name"];
    source?: RouteProp<ParamListBase, ScreenName>;
  };
};
