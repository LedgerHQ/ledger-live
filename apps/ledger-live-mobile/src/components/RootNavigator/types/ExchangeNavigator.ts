import { ScreenName } from "~/const";

export type ExchangeNavigatorParamList = {
  [ScreenName.ExchangeBuy]:
    | {
        account?: string;
        currency?: string; // Used for the deeplink only
        defaultAccountId?: string;
        defaultCurrencyId?: string;
        defaultTicker?: string;
        goToURL?: string;
        lastScreen?: string;
        name?: string;
        platform?: string;
        referrer?: string;
      }
    | undefined;
  [ScreenName.ExchangeSell]:
    | {
        account?: string;
        currency?: string; // Used for the deeplink only
        defaultAccountId?: string;
        defaultCurrencyId?: string;
        defaultTicker?: string;
        goToURL?: string;
        lastScreen?: string;
        name?: string;
        platform?: string;
        referrer?: string;
      }
    | undefined;
  [ScreenName.Card]:
    | {
        goToURL?: string;
        lastScreen?: string;
        name?: string;
        platform?: string;
        referrer?: string;
      }
    | undefined;
};
