import type { Transaction, TransactionStatus } from "@ledgerhq/live-common/families/stellar/types";
import type { Operation } from "@ledgerhq/types-live";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { ScreenName } from "~/const";

export type StellarAddAssetFlowParamList = {
  [ScreenName.StellarAddAssetSelectAsset]: {
    accountId: string;
  };
  [ScreenName.StellarAddAssetSelectDevice]: {
    device?: Device;
    accountId: string;
    parentId?: string;
    transaction: Transaction;
    status: TransactionStatus;
  };
  [ScreenName.StellarAddAssetConnectDevice]: {
    device: Device;
    accountId: string;
    parentId?: string;
    transaction?: Transaction;
    status?: TransactionStatus;
    appName?: string;
    selectDeviceLink?: boolean;
    onSuccess?: (payload: unknown) => void;
    onError?: (error: Error) => void;
    analyticsPropertyFlow?: string;
  };
  [ScreenName.StellarAddAssetValidation]: {
    accountId: string;
    deviceId: string;
    modelId: DeviceModelId;
    wired: boolean;
    transaction: Transaction;
    status: TransactionStatus;
  };
  [ScreenName.StellarAddAssetValidationError]: {
    accountId: string;
    parentId?: string;
    deviceId: string;
    transaction: Transaction;
    error: Error;
  };
  [ScreenName.StellarAddAssetValidationSuccess]: {
    accountId: string;
    parentId?: string;
    deviceId: string;
    transaction: Transaction;
    result: Operation;
  };
};
