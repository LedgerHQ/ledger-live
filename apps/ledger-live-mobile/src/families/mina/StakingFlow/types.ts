import { Transaction, TransactionStatus } from "@ledgerhq/live-common/families/mina/types";
import { Device } from "@ledgerhq/types-devices";
import { Operation } from "@ledgerhq/types-live";
import { ScreenName } from "~/const";

export type MinaStakingFlowParamList = {
  [ScreenName.MinaStakingValidator]: {
    accountId: string;
    source?: ScreenName;
  };
  [ScreenName.MinaStakingSummary]: {
    accountId: string;
    transaction: Transaction;
  };
  [ScreenName.MinaStakingSelectDevice]: {
    accountId: string;
    parentId?: string;
    transaction: Transaction;
    status?: TransactionStatus;
  };
  [ScreenName.MinaStakingConnectDevice]: {
    device: Device;
    accountId: string;
    parentId?: string;
    transaction: Transaction;
    status?: TransactionStatus;
    appName?: string;
    selectDeviceLink?: boolean;
    onSuccess?: (payload: unknown) => void;
    onError?: (error: Error) => void;
    analyticsPropertyFlow?: string;
    forceSelectDevice?: boolean;
  };
  [ScreenName.MinaStakingValidationError]: {
    accountId: string;
    parentId?: string;
    deviceId: string;
    transaction: Transaction;
    error: Error;
  };
  [ScreenName.MinaStakingValidationSuccess]: {
    accountId: string;
    parentId?: string;
    deviceId: string;
    transaction: Transaction;
    result: Operation;
  };
};
