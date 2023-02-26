import type {
  Transaction,
  TransactionStatus,
} from "@ledgerhq/live-common/families/icon/types";
import type { Operation } from "@ledgerhq/types-live";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import { ScreenName } from "../../../const";

export type IconVoteFlowParamList = {
  [ScreenName.IconVoteStarted]: {
    accountId: string;
  };
  [ScreenName.IconVoteSelectValidator]: {
    accountId: string;
    transaction?: Transaction;
    status?: TransactionStatus;
    fromStep2?: boolean;
  };
  [ScreenName.IconVoteCast]: {
    accountId: string;
    transaction: Transaction;
  };
  [ScreenName.IconVoteConnectDevice]: {
    device: Device;
    accountId: string;
    transaction?: Transaction;
    status?: TransactionStatus;
    appName?: string;
    selectDeviceLink?: boolean;
    onSuccess?: (payload: unknown) => void;
    onError?: (error: Error) => void;
    analyticsPropertyFlow?: string;
  };
  [ScreenName.IconVoteSelectDevice]: {
    device?: Device;
    accountId: string;
    transaction: Transaction;
    status: TransactionStatus;
  };
  [ScreenName.IconVoteValidationSuccess]: {
    accountId: string;
    deviceId: string;
    transaction: Transaction;
    result: Operation;
  };
  [ScreenName.IconVoteValidationError]: {
    accountId: string;
    deviceId: string;
    transaction: Transaction;
    error: Error;
  };
};
