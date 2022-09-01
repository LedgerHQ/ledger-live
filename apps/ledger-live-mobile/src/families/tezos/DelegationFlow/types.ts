import type {
  Transaction,
  TransactionStatus,
} from "@ledgerhq/live-common/families/tezos/types";
import type { Operation } from "@ledgerhq/types-live";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import { ScreenName } from "../../../const";

export type TezosDelegationFlowParamList = {
  [ScreenName.DelegationStarted]: {
    accountId: string;
    parentId?: string;
  };
  [ScreenName.DelegationSummary]: {
    mode?: "delegate" | "undelegate";
    accountId: string;
    parentId?: string;
    transaction?: Transaction;
    status?: TransactionStatus;
  };
  [ScreenName.DelegationSelectValidator]: {
    accountId: string;
    parentId?: string;
    transaction: Transaction;
    status: TransactionStatus;
  };
  [ScreenName.DelegationConnectDevice]: {
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
  [ScreenName.DelegationSelectDevice]: {
    device?: Device;
    parentId?: string;
    accountId: string;
    transaction: Transaction;
    status: TransactionStatus;
  };
  [ScreenName.DelegationValidationSuccess]: {
    accountId: string;
    parentId?: string;
    deviceId: string;
    transaction: Transaction;
    result: Operation;
  };
  [ScreenName.DelegationValidationError]: {
    accountId: string;
    parentId?: string;
    deviceId: string;
    transaction: Transaction;
    error: Error;
  };
};
