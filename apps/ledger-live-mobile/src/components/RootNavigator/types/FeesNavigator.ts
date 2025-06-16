import { Strategy } from "@ledgerhq/coin-evm/lib/types/index";
import { Transaction } from "@ledgerhq/live-common/generated/types";
import { Account, AccountLike } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { ScreenName } from "~/const";

export type FeesNavigatorParamsList = {
  [ScreenName.FeeHomePage]: {
    account: AccountLike;
    feePayingAccount: Account;
    feesStrategy: Strategy;
    fromAmount: BigNumber | undefined;
    customFeeConfig: object;
    onSelect(feesStrategy: Strategy, customFeeConfig: object): Promise<void>;
    transaction: Transaction;
  };
  [ScreenName.FeeCustomFeePage]: undefined;
};
