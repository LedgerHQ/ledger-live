import type {
  CosmosValidatorItem,
  Transaction,
  TransactionStatus,
} from "@ledgerhq/live-common/families/cosmos/types";
import type { Operation } from "@ledgerhq/types-live";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import { BigNumber } from "bignumber.js";
import { ScreenName } from "../../../const";

export type CosmosDelegationFlowParamList = {
  [ScreenName.CosmosDelegationStarted]: {
    accountId: string;
  };
  [ScreenName.CosmosDelegationValidator]: {
    accountId: string;
    validator?: CosmosValidatorItem;
    transaction?: Transaction;
    fromSelectAmount?: boolean;
  };
  [ScreenName.CosmosDelegationValidatorSelect]: {
    accountId: string;
    validator?: CosmosValidatorItem;
    transaction?: Transaction;
    fromSelectAmount?: boolean;
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
  };
  [ScreenName.CosmosDelegationSelectDevice]: {
    accountId: string;
    parentId?: string;
    transaction?: Transaction;
    status?: TransactionStatus;
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
  };
  [ScreenName.CosmosDelegationValidationError]: {
    accountId: string;
    deviceId: string;
    transaction: Transaction;
    error: Error;
  };
  [ScreenName.CosmosDelegationValidationSuccess]: {
    accountId: string;
    deviceId: string;
    transaction: Transaction;
    result: Operation;
  };
};
