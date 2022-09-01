import {
  Transaction,
  TransactionStatus,
} from "@ledgerhq/live-common/generated/types";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { Operation } from "@ledgerhq/types-live";
import { ScreenName } from "../../../const";

export type LendingSupplyFlowNavigatorParamList = {
  [ScreenName.LendingSupplyAmount]: {
    accountId: string;
    parentId: string;
    currency: TokenCurrency;
  };
  [ScreenName.LendingSupplySummary]: {
    accountId: string;
    deviceId: string;
    transaction: Transaction;
    currentNavigation?: string;
    nextNavigation?: string;
    overrideAmountLabel?: string;
    hideTotal?: boolean;
    appName?: string;
  };
  [ScreenName.LendingSupplySelectDevice]: object;
  [ScreenName.LendingSupplyConnectDevice]: {
    device: Device;
    accountId: string;
    transaction: Transaction;
    status: TransactionStatus;
    appName?: string;
    selectDeviceLink?: boolean;
    onSuccess?: (payload: unknown) => void;
    onError?: (error: Error) => void;
    analyticsPropertyFlow?: string;
  };
  [ScreenName.LendingSupplyValidationSuccess]: {
    accountId: string;
    deviceId: string;
    transaction: Transaction;
    result: Operation;
    currency: TokenCurrency;
  };
  [ScreenName.LendingSupplyValidationError]: {
    accountId: string;
    parentId: string;
    deviceId: string;
    transaction: Transaction;
    error: Error;
    currency: TokenCurrency;
  };
};
