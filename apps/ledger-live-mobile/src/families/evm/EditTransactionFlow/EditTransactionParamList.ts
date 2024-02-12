import { EditType } from "@ledgerhq/coin-evm/types/editTransaction";
import { TransactionRaw, TransactionStatusRaw } from "@ledgerhq/coin-evm/types/index";
import { Transaction, TransactionStatus } from "@ledgerhq/live-common/generated/types";
import { Device } from "@ledgerhq/types-devices";
import { Account, AccountLike, Operation } from "@ledgerhq/types-live";
import { ScreenName } from "~/const";

export type EditTransactionParamList = {
  [ScreenName.TransactionAlreadyValidatedError]: {
    error: Error;
  };
  [ScreenName.EvmEditTransactionMethodSelection]: {
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
    currentNavigation: ScreenName.EvmEditTransactionMethodSelection;
    nextNavigation: ScreenName.SignTransactionSelectDevice | ScreenName.SendSelectDevice;
    overrideAmountLabel?: string;
    hideTotal?: boolean;
    appName?: string;
    editType: EditType;
  };
  [ScreenName.EvmCustomFees]: {
    accountId: string;
    parentId?: string;
    transaction: TransactionStatusRaw;
    currentNavigation: ScreenName.SendSummary;
    nextNavigation: ScreenName.SendSelectDevice;
    transactionRaw?: TransactionRaw;
    setTransaction: (transaction: Transaction) => void;
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
