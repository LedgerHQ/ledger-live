import type { Transaction, TransactionStatus } from "@ledgerhq/live-common/families/hedera/types";
import type { Operation } from "@ledgerhq/types-live";
import type { TokenCurrency } from "@ledgerhq/types-cryptoassets";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";

import { ScreenName } from "~/const";

export type HederaAssociateTokenFlowParamList = {
  [ScreenName.HederaAssociateTokenSelectToken]: {
    accountId: string;
  };
  [ScreenName.HederaAssociateTokenSummary]: {
    accountId: string;
    token: TokenCurrency;
  };
  [ScreenName.HederaAssociateTokenSelectDevice]: {
    accountId: string;
    parentId?: string;
    transaction?: Transaction;
    status?: TransactionStatus;
  };
  [ScreenName.HederaAssociateTokenConnectDevice]: {
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
    forceSelectDevice?: boolean;
  };
  [ScreenName.HederaAssociateTokenValidationError]: {
    accountId: string;
    deviceId: string;
    transaction: Transaction;
    error: Error;
  };
  [ScreenName.HederaAssociateTokenValidationSuccess]: {
    accountId: string;
    deviceId: string;
    transaction: Transaction;
    result: Operation;
  };
};
