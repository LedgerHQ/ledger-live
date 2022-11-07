import { ScreenName } from "../../../const";

export type ExchangeNavigatorParamList = {
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
