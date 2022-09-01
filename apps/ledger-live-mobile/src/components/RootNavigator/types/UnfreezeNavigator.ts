import type {
  Transaction,
  TransactionStatus,
} from "@ledgerhq/live-common/generated/types";
import type { Device } from "@ledgerhq/types-devices";
import type { Operation } from "@ledgerhq/types-live";
import { ScreenName } from "../../../const";

export type UnfreezeNavigatorParamList = {
  [ScreenName.UnfreezeAmount]: {
    accountId: string;
    transaction: Transaction;
  };
  [ScreenName.UnfreezeSelectDevice]: object;
  [ScreenName.UnfreezeConnectDevice]: {
    device: Device;
    accountId: string;
    transaction: Transaction;
    status: TransactionStatus;
    appName?: string;
    selectDeviceLink?: boolean;
    onSuccess?: (payload: unknown) => void;
    onError?: (error: Error) => void;
    analyticsPropertyFlow?: string;
  };
  [ScreenName.UnfreezeValidationSuccess]: {
    accountId: string;
    deviceId: string;
    transaction: Transaction;
    result: Operation;
  };
  [ScreenName.UnfreezeValidationError]: {
    accountId: string;
    deviceId: string;
    transaction: Transaction;
    error: Error;
  };
};
