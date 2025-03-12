import { Account, TokenAccount } from "@ledgerhq/types-live";
import { ScreenName } from "~/const";

export type NoFundsNavigatorParamList = {
  [ScreenName.NoFunds]: {
    account: Account | TokenAccount;
    parentAccount?: Account;
    entryPoint?: "get-funds" | undefined;
  };
};
