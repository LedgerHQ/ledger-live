import type {
  CosmosMappedDelegation,
  Transaction,
  TransactionStatus,
} from "@ledgerhq/live-common/families/cosmos/types";
import type { Operation } from "@ledgerhq/types-live";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import { ScreenName } from "../../../const";

export type CosmosUndelegationFlowParamList = {
  [ScreenName.CosmosUndelegationAmount]: {
    accountId: string;
    delegation: CosmosMappedDelegation;
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
