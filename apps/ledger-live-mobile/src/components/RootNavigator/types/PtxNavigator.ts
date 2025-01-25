import { ScreenName } from "~/const";

type CommonParams = {
  goToURL?: string;
  lastScreen?: string;
  name?: string;
  platform?: string;
  referrer?: string;
};

type ExchangeParams = CommonParams & {
  account?: string;
  currency?: string; // Used for the deeplink only
  defaultAccountId?: string;
  defaultCurrencyId?: string;
  defaultTicker?: string;
  mode?: "offRamp" | "onRamp";
};

export type PtxNavigatorParamList = {
  [ScreenName.ExchangeBuy]?: ExchangeParams & {
    parentId?: string;
  };
  [ScreenName.ExchangeSell]?: ExchangeParams;
  [ScreenName.Card]?: CommonParams;
};
