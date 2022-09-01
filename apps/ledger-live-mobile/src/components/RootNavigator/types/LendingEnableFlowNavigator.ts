import { Transaction } from "@ledgerhq/live-common/generated/types";
import { TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { ScreenName } from "../../../const";

export type LendingEnableFlowParamsList = {
  [ScreenName.LendingEnableSelectAccount]: {
    token: TokenCurrency;
  };
  [ScreenName.LendingEnableAmount]: {
    accountId: string;
    parentId: string;
    currency: TokenCurrency;
    transaction?: Transaction;
  };
  [ScreenName.LendingEnableAmountAdvanced]: undefined;
  [ScreenName.LendingEnableAmountInput]: undefined;
  [ScreenName.LendingEnableSummary]: undefined;
  [ScreenName.LendingEnableSelectDevice]: undefined;
  [ScreenName.LendingEnableConnectDevice]: undefined;
  [ScreenName.LendingEnableValidationSuccess]: undefined;
  [ScreenName.LendingEnableValidationError]: undefined;
};
