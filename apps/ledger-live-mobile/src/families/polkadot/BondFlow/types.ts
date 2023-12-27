import type { Transaction, TransactionStatus } from "@ledgerhq/live-common/families/polkadot/types";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import type { Operation } from "@ledgerhq/types-live";
import { ScreenName } from "~/const";

export type PolkadotBondFlowParamList = {
  [ScreenName.PolkadotBondStarted]: {
    accountId: string;
    transaction: Transaction;
  };
  [ScreenName.PolkadotBondAmount]: {
    accountId: string;
    transaction: Transaction;
  };
  [ScreenName.PolkadotBondSelectDevice]: {
    accountId: string;
    parentId?: string;
    transaction?: Transaction | null;
    status?: TransactionStatus;
  };
  [ScreenName.PolkadotBondConnectDevice]: {
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
  [ScreenName.PolkadotBondValidationSuccess]: {
    accountId: string;
    deviceId: string;
    transaction: Transaction;
    result: Operation;
  };
  [ScreenName.PolkadotBondValidationError]: {
    accountId: string;
    deviceId: string;
    transaction: Transaction;
    error: Error;
  };
};
