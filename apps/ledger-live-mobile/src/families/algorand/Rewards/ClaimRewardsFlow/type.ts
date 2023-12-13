import { Transaction, TransactionStatus } from "@ledgerhq/live-common/families/algorand/types";
import type { DeviceModelId } from "@ledgerhq/devices";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import type { Operation } from "@ledgerhq/types-live";
import { ScreenName } from "~/const";

export type AlgorandClaimRewardsFlowParamList = {
  [ScreenName.AlgorandClaimRewardsStarted]: {
    accountId: string;
  };
  [ScreenName.AlgorandClaimRewardsSelectDevice]: {
    accountId: string;
    parentId?: string;
    transaction?: Transaction | null;
    status?: TransactionStatus;
  };
  [ScreenName.AlgorandClaimRewardsConnectDevice]: {
    device: Device;
    accountId: string;
    parentId: string;
    transaction: Transaction;
    status: TransactionStatus;
    appName?: string;
    selectDeviceLink?: boolean;
    onSuccess?: (payload: unknown) => void;
    onError?: (error: Error) => void;
    analyticsPropertyFlow?: string;
  };
  [ScreenName.AlgorandClaimRewardsSummary]: {
    accountId: string;
    deviceId: string;
    modelId: DeviceModelId;
    wired: boolean;
    transaction: Transaction;
    status: TransactionStatus;
  };
  [ScreenName.AlgorandClaimRewardsValidationError]: {
    accountId: string;
    deviceId: string;
    transaction: Transaction;
    error: Error;
  };
  [ScreenName.AlgorandClaimRewardsValidationSuccess]: {
    accountId: string;
    deviceId: string;
    transaction: Transaction;
    result: Operation;
  };
  [ScreenName.AlgorandClaimRewardsInfo]: {
    accountId: string;
  };
};
