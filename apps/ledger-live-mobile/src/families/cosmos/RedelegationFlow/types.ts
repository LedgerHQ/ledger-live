import type {
  CosmosValidatorItem,
  Transaction,
  TransactionStatus,
} from "@ledgerhq/live-common/families/cosmos/types";
import type { Operation } from "@ledgerhq/types-live";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import { BigNumber } from "bignumber.js";
import { ScreenName } from "../../../const";

export type CosmosRedelegationFlowParamList = {
  [ScreenName.CosmosRedelegationValidator]: {
    accountId: string;
    validator?: CosmosValidatorItem;
    validatorSrcAddress: string;
    transaction?: Transaction;
    fromSelectAmount?: boolean;
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
    nextScreen:
      | ScreenName.CosmosRedelegationValidator
      | ScreenName.CosmosRedelegationSelectDevice;
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
    nextScreen:
      | ScreenName.CosmosRedelegationValidator
      | ScreenName.CosmosRedelegationSelectDevice;
  };
  [ScreenName.CosmosRedelegationSelectDevice]: {
    accountId: string;
    parentId?: string;
    transaction?: Transaction;
    status?: TransactionStatus;
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
  };
  [ScreenName.CosmosRedelegationValidationError]: {
    accountId: string;
    deviceId: string;
    transaction: Transaction;
    error: Error;
  };
  [ScreenName.CosmosRedelegationValidationSuccess]: {
    accountId: string;
    deviceId: string;
    transaction: Transaction;
    result: Operation;
  };
};
