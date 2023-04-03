import {
  TransactionRaw,
  Transaction as EthereumTransaction,
} from "@ledgerhq/live-common/families/ethereum/types";
import {
  Transaction,
  TransactionStatus,
} from "@ledgerhq/live-common/generated/types";
import { Device } from "@ledgerhq/types-devices";
import { Account, AccountLike, Operation } from "@ledgerhq/types-live";

import { ScreenName } from "../../const";

export type EditTransactionParamList = {
  [ScreenName.EditTransactionMethodSelection]: {
    operation: Operation;
    account: AccountLike;
    parentAccount: Account | undefined | null;
  };
  [ScreenName.EthereumCustomFees]: {
    accountId: string;
    parentId?: string;
    transaction: EthereumTransaction;
    currentNavigation: ScreenName.EditTransactionMethodSelection;
    nextNavigation: ScreenName.SendSelectDevice;
    setTransaction: (transaction: Transaction) => void;
  };
  [ScreenName.SendSummary]: {
    accountId: string;
    parentId?: string;
    deviceId?: string;
    transaction: Transaction;
    transactionRaw?: TransactionRaw;
    operation?: Operation;
    currentNavigation:
      | ScreenName.EditTransactionMethodSelection
      | ScreenName.SendSummary;
    nextNavigation:
      | ScreenName.SignTransactionSelectDevice
      | ScreenName.SendSelectDevice;
    overrideAmountLabel?: string;
    hideTotal?: boolean;
    appName?: string;
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
