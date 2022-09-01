import {
  Transaction,
  TransactionStatus,
} from "@ledgerhq/live-common/generated/types";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { Operation } from "@ledgerhq/types-live";
import { ScreenName } from "../../../const";

export type LendingEnableFlowParamsList = {
  [ScreenName.LendingEnableSelectAccount]: {
    token: TokenCurrency;
  };
  [ScreenName.LendingEnableAmount]:
    | {
        accountId: string;
        parentId?: string | null;
        currency?: TokenCurrency;
        transaction?: Transaction;
      }
    | undefined;
  [ScreenName.LendingEnableAmountAdvanced]: {
    accountId?: string;
    parentId?: string | null;
    transaction?: Transaction | null;
    currency?: TokenCurrency;
  };
  [ScreenName.LendingEnableAmountInput]: {
    accountId?: string;
    transaction?: Transaction;
    currency?: TokenCurrency;
  };
  [ScreenName.LendingEnableSummary]: {
    accountId?: string | null;
    parentId?: string | null;
    deviceId: string;
    transaction?: Transaction;
    overrideAmountLabel?: string;
    hideTotal?: boolean;
    appName?: string;
    currentNavigation?: string;
    nextNavigation?: string;
  };
  [ScreenName.LendingEnableSelectDevice]: object;
  [ScreenName.LendingEnableConnectDevice]: {
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
  [ScreenName.LendingEnableValidationSuccess]: {
    accountId: string;
    deviceId: string;
    transaction: Transaction;
    result: Operation;
    currency: TokenCurrency;
  };
  [ScreenName.LendingEnableValidationError]: {
    accountId: string;
    parentId: string;
    deviceId: string;
    transaction: Transaction;
    error: Error;
    currency: TokenCurrency;
  };
};
