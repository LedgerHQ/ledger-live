import type { EditType, TransactionRaw } from "@ledgerhq/coin-bitcoin/types";
import type BigNumber from "bignumber.js";
import type {
  Transaction as BitcoinTransaction,
  TransactionStatus as BitcoinTransactionStatus,
} from "@ledgerhq/live-common/families/bitcoin/types";
import type { Transaction, TransactionStatus } from "@ledgerhq/live-common/generated/types";
import type { Device } from "@ledgerhq/types-devices";
import type { Account, AccountLike, Operation } from "@ledgerhq/types-live";
import type { ScreenName } from "~/const";

export type BitcoinEditTransactionParamList = {
  [ScreenName.TransactionAlreadyValidatedError]: {
    error: Error;
  };
  [ScreenName.BitcoinEditTransactionMethodSelection]: {
    operation: Operation;
    account: AccountLike;
    parentAccount: Account | undefined | null;
  };
  [ScreenName.EditTransactionSummary]: {
    accountId: string;
    parentId?: string;
    deviceId?: string;
    transaction: Transaction;
    transactionRaw?: TransactionRaw;
    operation?: Operation;
    currentNavigation: ScreenName.EditTransactionSummary;
    nextNavigation: ScreenName.SignTransactionSelectDevice | ScreenName.SendSelectDevice;
    overrideAmountLabel?: string;
    hideTotal?: boolean;
    appName?: string;
    editType: EditType;
  };
  [ScreenName.BitcoinEditCustomFees]: {
    accountId: string;
    parentId?: string;
    transaction: BitcoinTransaction;
    status?: BitcoinTransactionStatus;
    currentNavigation: ScreenName.EditTransactionSummary;
    nextNavigation: ScreenName.SendSelectDevice | ScreenName.SignTransactionSelectDevice;
    transactionRaw?: TransactionRaw;
    satPerByte?: BigNumber | null;
    setSatPerByte?: (_: BigNumber) => void;
  };
  [ScreenName.SendSelectDevice]: {
    accountId: string;
    parentId?: string;
    transaction: Transaction;
    status: TransactionStatus;
    appName?: string;
  };
  [ScreenName.SendConnectDevice]: {
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
  [ScreenName.SendValidationSuccess]: {
    accountId: string;
    parentId?: string;
    deviceId: string;
    transaction: Transaction;
    result: Operation;
  };
  [ScreenName.SendValidationError]:
    | undefined
    | {
        error?: Error;
        account?: AccountLike;
        accountId?: string;
        parentId?: string;
      };
};
