import { Transaction, TransactionStatus } from "@ledgerhq/live-common/families/algorand/types";
import type { DeviceModelId } from "@ledgerhq/devices";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import type { Operation } from "@ledgerhq/types-live";
import { ScreenName } from "~/const";

export type AlgorandOptInFlowParamList = {
  [ScreenName.AlgorandOptInSelectToken]: {
    accountId: string;
  };
  [ScreenName.AlgorandOptInSelectDevice]: {
    accountId: string;
    parentId?: string;
    transaction?: Transaction | null;
    status?: TransactionStatus;
  };
  [ScreenName.AlgorandOptInConnectDevice]: {
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
  [ScreenName.AlgorandOptInSummary]: {
    accountId: string;
    deviceId: string;
    modelId: DeviceModelId;
    wired: boolean;
    transaction: Transaction;
    status: TransactionStatus;
  };
  [ScreenName.AlgorandOptInValidationError]: {
    accountId: string;
    deviceId: string;
    transaction: Transaction;
    error: Error;
  };
  [ScreenName.AlgorandOptInValidationSuccess]: {
    accountId: string;
    deviceId: string;
    transaction: Transaction;
    result: Operation;
  };
};
