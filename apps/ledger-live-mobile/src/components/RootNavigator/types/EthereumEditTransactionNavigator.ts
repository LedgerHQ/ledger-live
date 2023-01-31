import { Transaction } from "@ledgerhq/live-common/families/ethereum/types";
import { TransactionStatus } from "@ledgerhq/live-common/generated/types";
import { Device } from "@ledgerhq/types-devices";
import { AccountLike, Operation } from "@ledgerhq/types-live";

import { ScreenName } from "../../../const";

export type EthereumEditTransactionParamList = {
  [ScreenName.EditEthereumTransactionMethodSelection]: {
    operation: Operation;
    account: AccountLike;
    parentAccount: AccountLike | undefined | null;
  };
  [ScreenName.CancelTransaction]: {
    operation: Operation;
    account: AccountLike;
    parentAccount: AccountLike | undefined | null;
  };
  [ScreenName.SpeedUpTransaction]: {
    operation: Operation;
    account: AccountLike;
    parentAccount: AccountLike | undefined | null;
  };
  [ScreenName.EthereumCustomFees]: {
    accountId: string;
    parentId?: string;
    transaction: Transaction;
    currentNavigation: ScreenName.SpeedUpTransaction;
    nextNavigation: ScreenName.SendSelectDevice;
    setTransaction: (transaction: Transaction) => void;
  };
  [ScreenName.SendSummary]: {
    accountId: string;
    parentId?: string;
    deviceId?: string;
    transaction: Transaction;
    currentNavigation: ScreenName.SpeedUpTransaction | ScreenName.SendSummary;
    nextNavigation:
      | ScreenName.SignTransactionSelectDevice
      | ScreenName.SendSelectDevice;
    overrideAmountLabel?: string;
    hideTotal?: boolean;
    hideFees?: boolean;
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
