import type BigNumber from "bignumber.js";
import type { Operation } from "@ledgerhq/types-live";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import type { Transaction } from "@ledgerhq/live-common/generated/types";
import type {
  MultiversXAccount,
  MultiversXProvider,
  TransactionStatus,
} from "@ledgerhq/live-common/families/multiversx/types";
import type { ScreenName } from "~/const";

export type MultiversXWithdrawFlowParamList = {
  [ScreenName.MultiversXWithdrawFunds]: {
    account: MultiversXAccount;
    validator: MultiversXProvider;
    amount: BigNumber;
  };
  [ScreenName.MultiversXWithdrawSelectDevice]: {
    accountId: string;
    parentId?: string;
    transaction?: Transaction;
    status?: TransactionStatus;
  };
  [ScreenName.MultiversXWithdrawConnectDevice]: {
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
  [ScreenName.MultiversXWithdrawValidationError]: {
    accountId: string;
    deviceId: string;
    transaction: Transaction;
    error: Error;
  };
  [ScreenName.MultiversXWithdrawValidationSuccess]: {
    accountId: string;
    deviceId: string;
    transaction: Transaction;
    result: Operation;
  };
};
