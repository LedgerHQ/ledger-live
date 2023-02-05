import type {
  CosmosMappedDelegation,
  CosmosValidatorItem,
  Transaction,
  TransactionStatus,
} from "@ledgerhq/live-common/families/cosmos/types";
import type { Operation } from "@ledgerhq/types-live";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import BigNumber from "bignumber.js";
import { ScreenName } from "../../../const";

export type CosmosUndelegationFlowParamList = {
  [ScreenName.CosmosUndelegationAmount]: {
    accountId: string;
    delegation: CosmosMappedDelegation;
    transaction: Transaction;
    status: TransactionStatus;
    validator: CosmosValidatorItem;
    validatorSrc?: CosmosValidatorItem;
    min?: BigNumber;
    max?: BigNumber;
    value?: BigNumber;
    redelegatedBalance?: BigNumber;
    mode?: string;
    nextScreen: ScreenName.CosmosUndelegationSelectDevice;
  };
  [ScreenName.CosmosUndelegationSelectDevice]: {
    accountId: string;
    parentId?: string;
    transaction?: Transaction;
    status?: TransactionStatus;
  };
  [ScreenName.CosmosUndelegationConnectDevice]: {
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
  [ScreenName.CosmosUndelegationValidationError]: {
    accountId: string;
    deviceId: string;
    transaction: Transaction;
    error: Error;
  };
  [ScreenName.CosmosUndelegationValidationSuccess]: {
    accountId: string;
    deviceId: string;
    transaction: Transaction;
    result: Operation;
  };
};
