import type { CryptoOrTokenCurrency } from "@domain/entity-currency";
import { ScreenName } from "~/const";

export type PayTabNavigatorParamList = {
  /**
   * `ledgerlive://paytab?code=…` is the OAuth redirect. React-navigation parses the query for
   * us, so the login flow receives the value from the route rather than from the raw URL. It hands
   * over the provider's own spelling, so the app id arrives as `app_id`.
   */
  [ScreenName.PayTab]: { code?: string; app_id?: string } | undefined;
  [ScreenName.PayTabRequestReceive]: {
    accountId: string;
    parentId?: string;
    currency: CryptoOrTokenCurrency;
  };
  [ScreenName.PayTabSelectContact]: undefined;
  [ScreenName.PayTabPayContact]: undefined;
};
