import type {
  CosmosValidatorItem,
  Transaction,
  TransactionStatus,
} from "@ledgerhq/live-common/families/cosmos/types";
import type { Operation } from "@ledgerhq/types-live";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import BigNumber from "bignumber.js";
import { ScreenName } from "~/const";

export type CosmosClaimRewardsFlowParamList = {
  [ScreenName.CosmosClaimRewardsValidator]: {
    accountId: string;
    transaction: Transaction;
  };
  [ScreenName.CosmosClaimRewardsMethod]: {
    accountId: string;
    transaction?: Transaction;
    validator: CosmosValidatorItem;
    value: BigNumber;
  };
  [ScreenName.CosmosClaimRewardsSelectDevice]: {
    accountId: string;
    parentId?: string;
    transaction?: Transaction;
    status?: TransactionStatus;
  };
  [ScreenName.CosmosClaimRewardsConnectDevice]: {
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
  [ScreenName.CosmosClaimRewardsValidationError]: {
    accountId: string;
    deviceId: string;
    transaction: Transaction;
    error: Error;
  };
  [ScreenName.CosmosClaimRewardsValidationSuccess]: {
    accountId: string;
    deviceId: string;
    transaction: Transaction;
    result: Operation;
  };
};
