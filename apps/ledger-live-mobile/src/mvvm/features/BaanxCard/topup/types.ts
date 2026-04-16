import type { Account, AccountLike, Operation } from "@ledgerhq/types-live";
import type { Transaction, TransactionStatus } from "@ledgerhq/live-common/generated/types";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import { ScreenName } from "~/const";

export type BaanxTopUpParamList = {
  [ScreenName.BaanxTopUpAmount]: {
    account: AccountLike | null;
    parentAccount?: Account;
    baanxAddress: string;
    baanxMemo?: string;
    coinTicker: string;
    agentId?: string;
  };
  [ScreenName.BaanxTopUpSelectDevice]: {
    accountId: string;
    parentId?: string;
    transaction: Transaction;
    status: TransactionStatus;
  };
  [ScreenName.BaanxTopUpConnectDevice]: {
    accountId: string;
    parentId?: string;
    transaction: Transaction;
    status: TransactionStatus;
    device: Device;
  };
  [ScreenName.BaanxTopUpLoading]: {
    accountId: string;
    parentId?: string;
    coinTicker?: string;
  };
  [ScreenName.BaanxTopUpValidationSuccess]: {
    accountId: string;
    parentId?: string;
    result?: Operation;
    coinTicker?: string;
  };
  [ScreenName.BaanxTopUpValidationError]: {
    accountId: string;
    parentId?: string;
    error: Error;
  };
};
