import type { Transaction, TransactionStatus } from "@ledgerhq/live-common/generated/types";
import type { Operation } from "@ledgerhq/types-live";
import type { Device } from "@ledgerhq/types-devices";
import { ScreenName } from "~/const";

export type ClaimRewardsNavigatorParamList = {
  [ScreenName.ClaimRewardsSelectDevice]: object;
  [ScreenName.ClaimRewardsConnectDevice]: {
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
  [ScreenName.ClaimRewardsValidationSuccess]: {
    accountId: string;
    deviceId: string;
    transaction: Transaction;
    result: Operation;
  };
  [ScreenName.ClaimRewardsValidationError]: {
    accountId: string;
    deviceId: string;
    transaction: Transaction;
    error: Error;
  };
};
