import {
  Transaction,
  TransactionStatus,
} from "@ledgerhq/live-common/generated/types";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { Operation } from "@ledgerhq/types-live";
import { ScreenName } from "../../../const";

export type LendingWithdrawFlowNavigatorParamList = {
  [ScreenName.LendingWithdrawAmount]: {
    accountId: string;
    parentId: string;
    currency: TokenCurrency;
  };
  [ScreenName.LendingWithdrawSummary]: {
    accountId: string;
    parentId?: string;
    deviceId: string;
    transaction: Transaction;
    currentNavigation?: string;
    nextNavigation?: string;
    overrideAmountLabel?: string;
    hideTotal?: boolean;
    appName?: string;
  };
  [ScreenName.LendingWithdrawSelectDevice]: object;
  [ScreenName.LendingWithdrawConnectDevice]: {
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
  };
  [ScreenName.LendingWithdrawValidationSuccess]: {
    accountId: string;
    parentId?: string;
    deviceId: string;
    transaction: Transaction;
    result: Operation;
    currency: TokenCurrency;
  };
  [ScreenName.LendingWithdrawValidationError]: {
    accountId: string;
    parentId?: string;
    deviceId: string;
    transaction: Transaction;
    error: Error;
    currency: TokenCurrency;
  };
};
