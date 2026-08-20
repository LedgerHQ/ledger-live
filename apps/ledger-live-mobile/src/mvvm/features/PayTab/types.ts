import { ScreenName } from "~/const";

export type PayTabNavigatorParamList = {
  /**
   * `ledgerlive://paytab?code=…` is the OAuth redirect. React-navigation parses the query for
   * us, so the login flow receives the two values from the route rather than from the raw URL.
   */
  [ScreenName.PayTab]: { code?: string } | undefined;
};
