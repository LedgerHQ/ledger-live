import type { Transaction, TransactionStatus } from "@ledgerhq/live-common/families/polkadot/types";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import type { Operation } from "@ledgerhq/types-live";
import { ScreenName } from "~/const";

export type PolkadotSimpleOperationFlowParamList = {
  [ScreenName.PolkadotSimpleOperationStarted]: {
    transaction?: Transaction | null;
    mode: "chill" | "withdrawUnbonded" | "setController";
    accountId?: string;
  };
  [ScreenName.PolkadotSimpleOperationSelectDevice]: {
    accountId: string;
    parentId?: string;
    mode: "chill" | "withdrawUnbonded" | "setController";
    transaction?: Transaction | null;
    status?: TransactionStatus;
  };
  [ScreenName.PolkadotSimpleOperationConnectDevice]: {
    device: Device;
    accountId: string;
    mode: "chill" | "withdrawUnbonded" | "setController";
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
  [ScreenName.PolkadotSimpleOperationValidationSuccess]: {
    accountId: string;
    mode: "chill" | "withdrawUnbonded" | "setController";
    deviceId: string;
    transaction: Transaction;
    result: Operation;
  };
  [ScreenName.PolkadotSimpleOperationValidationError]: {
    accountId: string;
    mode: "chill" | "withdrawUnbonded" | "setController";
    deviceId: string;
    transaction: Transaction;
    error: Error;
  };
};
