import { ScreenName } from "../../../const";

export type ExchangeLiveAppNavigatorParamList = {
  [ScreenName.ExchangeBuy]:
    | {
        defaultAccountId?: string;
        defaultCurrencyId?: string;
        defaultTicker?: string;
        currency?: string; // Used for the deeplink only
        platform?: string;
        name?: string;
        mode?: string;
        account?: string;
        parentId?: string;
      }
    | undefined;
  [ScreenName.ExchangeSell]:
    | {
        defaultAccountId?: string;
        defaultCurrencyId?: string;
        defaultTicker?: string;
        currency?: string; // Used for the deeplink only
        platform?: string;
        name?: string;
        mode?: string;
        account?: string;
      }
    | undefined;
};
