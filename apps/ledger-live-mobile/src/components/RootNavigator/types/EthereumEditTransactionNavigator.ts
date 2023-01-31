import { Transaction } from "@ledgerhq/live-common/families/ethereum/types";
import { AccountLike, Operation } from "@ledgerhq/types-live";

import { ScreenName } from "../../../const";

export type EthereumEditTransactionParamList = {
  [ScreenName.EditTransactionOptions]: {
    operation: Operation;
    account: AccountLike;
  };
  [ScreenName.CancelTransaction]: {
    operation: Operation;
    account: AccountLike;
  };
  [ScreenName.SpeedUpTransaction]: {
    operation: Operation;
    account: AccountLike;
  };
  [ScreenName.SendSummary]: {
    accountId: string;
    parentId?: string;
    deviceId?: string;
    transaction: Transaction;
    currentNavigation:
      | ScreenName.LendingWithdrawSummary
      | ScreenName.LendingSupplySummary
      | ScreenName.SignTransactionSummary
      | ScreenName.LendingEnableSummary
      | ScreenName.SignTransactionSummary
      | ScreenName.SendSummary
      | ScreenName.SwapForm;
    nextNavigation:
      | ScreenName.LendingWithdrawSelectDevice
      | ScreenName.LendingSupplySelectDevice
      | ScreenName.SignTransactionSelectDevice
      | ScreenName.LendingEnableSelectDevice
      | ScreenName.SignTransactionSelectDevice
      | ScreenName.SendSelectDevice
      | ScreenName.SwapForm;
    overrideAmountLabel?: string;
    hideTotal?: boolean;
    appName?: string;
  };
};
