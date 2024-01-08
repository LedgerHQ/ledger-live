import type { Transaction, TransactionStatus } from "@ledgerhq/live-common/families/tron/types";
import type { Operation } from "@ledgerhq/types-live";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import { ScreenName } from "~/const";

export type TronVoteFlowParamList = {
  [ScreenName.VoteStarted]: {
    accountId: string;
    parentId?: string;
  };
  [ScreenName.VoteSelectValidator]: {
    accountId: string;
    parentId?: string;
    transaction?: Transaction;
    status?: TransactionStatus;
    fromStep2?: boolean;
  };
  [ScreenName.VoteCast]: {
    accountId: string;
    parentId?: string;
    transaction: Transaction;
  };
  [ScreenName.VoteConnectDevice]: {
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
  [ScreenName.VoteSelectDevice]: {
    device?: Device;
    parentId?: string;
    accountId: string;
    transaction: Transaction;
    status: TransactionStatus;
  };
  [ScreenName.VoteValidationSuccess]: {
    accountId: string;
    parentId?: string;
    deviceId: string;
    transaction: Transaction;
    result: Operation;
  };
  [ScreenName.VoteValidationError]: {
    accountId: string;
    parentId?: string;
    deviceId: string;
    transaction: Transaction;
    error: Error;
  };
};
