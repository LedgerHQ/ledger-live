import { Account, AccountLike } from "@ledgerhq/types-live";
import { ScreenName } from "~/const";

export type NoFundsNavigatorParamList = {
  [ScreenName.NoFunds]: {
    account: AccountLike;
    parentAccount?: Account;
    entryPoint?: "get-funds" | undefined;
  };
};
