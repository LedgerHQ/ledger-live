import type { Transaction, TransactionStatus } from "@ledgerhq/live-common/families/polkadot/types";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import type { Operation } from "@ledgerhq/types-live";
import { ScreenName } from "~/const";

export type PolkadotRebondFlowParamList = {
  [ScreenName.PolkadotRebondAmount]: {
    accountId: string;
    transaction: Transaction;
  };
  [ScreenName.PolkadotRebondSelectDevice]: {
    accountId: string;
    parentId?: string;
    transaction?: Transaction | null;
    status?: TransactionStatus;
  };
  [ScreenName.PolkadotRebondConnectDevice]: {
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
  [ScreenName.PolkadotRebondValidationSuccess]: {
    accountId: string;
    deviceId: string;
    transaction: Transaction;
    result: Operation;
  };
  [ScreenName.PolkadotRebondValidationError]: {
    accountId: string;
    deviceId: string;
    transaction: Transaction;
    error: Error;
  };
};
