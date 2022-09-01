import type {
  Transaction,
  TransactionStatus,
} from "@ledgerhq/live-common/generated/types";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { ScreenName } from "../../../const";

type ListenersParams = {
  error?: Error;
  onError?: (err: Error) => void;
};

export type SignTransactionNavigatorParamList = {
  [ScreenName.SignTransactionSummary]: {
    accountId?: string;
    transaction?: Transaction;
    overrideAmountLabel?: string;
    hideTotal?: boolean;
    appName?: string;
    currentNavigation?: string;
    nextNavigation?: string;
  } & ListenersParams;
  [ScreenName.SignTransactionSelectDevice]: ListenersParams;
  [ScreenName.SignTransactionConnectDevice]: {
    device: Device;
    accountId: string;
    transaction: Transaction;
    status: TransactionStatus;
    appName?: string;
    onSuccess: (payload: unknown) => void;
    onError: (_: Error) => void;
  };
  [ScreenName.SignTransactionValidationError]: {
    accountId: string;
    parentId: string;
    deviceId: string;
    transaction: Transaction;
    onReject: (_: Error) => void;
  } & ListenersParams;
};
