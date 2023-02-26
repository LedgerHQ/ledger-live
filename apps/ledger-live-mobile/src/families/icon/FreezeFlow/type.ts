import {
  Transaction,
  TransactionStatus,
} from "@ledgerhq/live-common/generated/types";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { Operation } from "@ledgerhq/types-live";
import { ScreenName } from "../../../const";

export type IconFreezeFlowParamList = {
  [ScreenName.IconFreezeInfo]:
    | {
        accountId?: string;
        transaction?: Transaction;
      }
    | undefined;
  [ScreenName.IconFreezeAmount]:
    | {
        accountId?: string;
        transaction?: Transaction;
      }
    | undefined;
  [ScreenName.IconFreezeSelectDevice]: object;
  [ScreenName.IconFreezeConnectDevice]: {
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
  [ScreenName.IconFreezeValidationSuccess]: {
    accountId: string;
    deviceId: string;
    transaction: Transaction;
    result: Operation;
  };
  [ScreenName.IconFreezeValidationError]: {
    accountId: string;
    deviceId: string;
    transaction: Transaction;
    error: Error;
  };
};
