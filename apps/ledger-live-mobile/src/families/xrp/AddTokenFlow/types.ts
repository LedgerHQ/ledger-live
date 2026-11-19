import type { TokenCurrency } from "@domain/entity-currency-token";
import type { Transaction, TransactionStatus } from "@ledgerhq/live-common/families/xrp/types";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import type { Operation } from "@ledgerhq/types-live";
import { ScreenName } from "~/const";

// The limit is a base-units string: route params must stay serializable, a BigNumber is not
type BalanceLimit = Readonly<{ limit: string; isMaximum: boolean }>;

export type XrpAddTokenFlowParamList = {
  [ScreenName.XrpAddTokenSelectToken]: {
    accountId: string;
  };
  [ScreenName.XrpAddTokenReview]: {
    accountId: string;
    token: TokenCurrency;
    balanceLimit?: BalanceLimit;
  };
  [ScreenName.XrpAddTokenBalanceLimit]: {
    accountId: string;
    token: TokenCurrency;
    balanceLimit: BalanceLimit;
  };
  [ScreenName.XrpAddTokenSelectDevice]: {
    accountId: string;
    parentId?: string;
    token: TokenCurrency;
    transaction: Transaction;
    status: TransactionStatus;
  };
  [ScreenName.XrpAddTokenConnectDevice]: {
    device: Device;
    accountId: string;
    parentId?: string;
    token: TokenCurrency;
    transaction: Transaction;
    status: TransactionStatus;
    appName?: string;
    selectDeviceLink?: boolean;
    onSuccess?: (payload: unknown) => void;
    onError?: (error: Error) => void;
    analyticsPropertyFlow?: string;
    forceSelectDevice?: boolean;
  };
  [ScreenName.XrpAddTokenValidationError]: {
    accountId: string;
    deviceId: string;
    transaction: Transaction;
    error: Error;
  };
  [ScreenName.XrpAddTokenValidationSuccess]: {
    accountId: string;
    deviceId: string;
    token: TokenCurrency;
    transaction: Transaction;
    result: Operation;
  };
};
