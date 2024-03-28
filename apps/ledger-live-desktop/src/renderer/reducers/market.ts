import { handleActions } from "redux-actions";
import { Handlers } from "./types";
import { MarketListRequestParams } from "@ledgerhq/live-common/market/types";

export type MarketState = {
  marketParams: MarketListRequestParams;
  starredMarketCoins: string[];
};

const initialState: MarketState = {
  marketParams: {
    range: "24h",
    limit: 50,
    ids: [],
    starred: [],
    orderBy: "market_cap",
    order: "desc",
    search: "",
    liveCompatible: false,
    page: 1,
    counterCurrency: "usd",
  },
  starredMarketCoins: [],
};

type HandlersPayloads = {
  MARKET_SET_VALUES: MarketListRequestParams;
  ADD_STARRED_MARKET_COINS: string;
  REMOVE_STARRED_MARKET_COINS: string;
};

type MarketHandlers<PreciseKey = true> = Handlers<MarketState, HandlersPayloads, PreciseKey>;

const handlers: MarketHandlers = {
  MARKET_SET_VALUES: (state: MarketState, { payload }: { payload: MarketListRequestParams }) => ({
    ...state,
    marketParams: {
      ...state.marketParams,
      ...payload,
    },
  }),
  ADD_STARRED_MARKET_COINS: (state: MarketState, { payload }: { payload: string }) => ({
    ...state,
    starredMarketCoins: [...state.starredMarketCoins, payload],
  }),
  REMOVE_STARRED_MARKET_COINS: (state: MarketState, { payload }: { payload: string }) => ({
    ...state,
    starredMarketCoins: state.starredMarketCoins.filter(id => id !== payload),
  }),
};

// Selectors

export const marketParamsSelector = (state: { market: MarketState }) => state.market.marketParams;
export const starredMarketCoinsSelector = (state: { market: MarketState }) =>
  state.market.starredMarketCoins;
// Exporting reducer

export default handleActions<MarketState, HandlersPayloads[keyof HandlersPayloads]>(
  handlers as unknown as MarketHandlers<false>,
  initialState,
);
