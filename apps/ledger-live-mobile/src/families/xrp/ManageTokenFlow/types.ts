import type { TokenCurrency } from "@domain/entity-currency-token";
import type { Transaction, TransactionStatus } from "@ledgerhq/live-common/families/xrp/types";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import type { Operation } from "@ledgerhq/types-live";
import { ScreenName } from "~/const";
import type { TokenSettings } from "../AddTokenFlow/types";

type TokenAccountParams = {
  accountId: string;
  parentId: string;
};

export type XrpManageTokenFlowParamList = {
  [ScreenName.XrpManageTokenManage]: TokenAccountParams;
  [ScreenName.XrpManageTokenSettings]: TokenAccountParams;
  [ScreenName.XrpManageTokenReview]: TokenAccountParams & {
    settings: TokenSettings;
  };
  [ScreenName.XrpManageTokenSelectDevice]: TokenAccountParams & {
    token: TokenCurrency;
    transaction: Transaction;
    status: TransactionStatus;
    settings: TokenSettings;
  };
  [ScreenName.XrpManageTokenConnectDevice]: TokenAccountParams & {
    device: Device;
    token: TokenCurrency;
    transaction: Transaction;
    status: TransactionStatus;
    settings: TokenSettings;
    appName?: string;
    selectDeviceLink?: boolean;
    onSuccess?: (payload: unknown) => void;
    onError?: (error: Error) => void;
    analyticsPropertyFlow?: string;
    forceSelectDevice?: boolean;
  };
  [ScreenName.XrpManageTokenValidationError]: TokenAccountParams & {
    deviceId: string;
    transaction: Transaction;
    error: Error;
  };
  [ScreenName.XrpManageTokenValidationSuccess]: TokenAccountParams & {
    deviceId: string;
    token: TokenCurrency;
    transaction: Transaction;
    settings: TokenSettings;
    result: Operation;
  };
};
