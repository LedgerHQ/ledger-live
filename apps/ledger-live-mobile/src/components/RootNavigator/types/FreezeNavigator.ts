import { Transaction, TransactionStatus } from "@ledgerhq/live-common/generated/types";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { Operation } from "@ledgerhq/types-live";
import { ScreenName } from "~/const";

export type FreezeNavigatorParamList = {
  [ScreenName.FreezeInfo]:
    | {
        accountId?: string;
        transaction?: Transaction;
      }
    | undefined;
  [ScreenName.FreezeAmount]:
    | {
        accountId?: string;
        transaction?: Transaction;
      }
    | undefined;
  [ScreenName.FreezeSelectDevice]: object;
  [ScreenName.FreezeConnectDevice]: {
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
  [ScreenName.FreezeValidationSuccess]: {
    accountId: string;
    deviceId: string;
    transaction: Transaction;
    result: Operation;
  };
  [ScreenName.FreezeValidationError]: {
    accountId: string;
    deviceId: string;
    transaction: Transaction;
    error: Error;
  };
};
