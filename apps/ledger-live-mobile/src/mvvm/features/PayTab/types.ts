import type { Account, AccountLike } from "@ledgerhq/types-live";
import { ScreenName } from "~/const";

export type PayTabNavigatorParamList = {
  /**
   * `ledgerlive://paytab?code=…` is the OAuth redirect. React-navigation parses the query for
   * us, so the login flow receives the value from the route rather than from the raw URL.
   */
  [ScreenName.PayTab]: { code?: string } | undefined;
  [ScreenName.PayTabRequestReceive]: {
    account: AccountLike;
    parentAccount?: Account;
  };
};
