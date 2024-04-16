import { handleActions } from "redux-actions";
import { Handlers } from "./types";
import { MarketListRequestParams } from "@ledgerhq/live-common/market/types";

export type MarketState = {
  marketParams: MarketListRequestParams;
  starredMarketCoins: string[];
  currentPage: number;
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
  currentPage: 1,
  starredMarketCoins: [],
};

type HandlersPayloads = {
  MARKET_SET_VALUES: MarketListRequestParams;
  ADD_STARRED_MARKET_COINS: string;
  REMOVE_STARRED_MARKET_COINS: string;
  MARKET_SET_CURRENT_PAGE: number;
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
  MARKET_SET_CURRENT_PAGE: (state: MarketState, { payload }: { payload: number }) => ({
    ...state,
    currentPage: payload,
  }),
};

// Selectors

export const marketParamsSelector = (state: { market: MarketState }) => state.market.marketParams;
export const starredMarketCoinsSelector = (state: { market: MarketState }) =>
  state.market.starredMarketCoins;
export const marketCurrentPageSelector = (state: { market: MarketState }) =>
  state.market.currentPage;
// Exporting reducer

export default handleActions<MarketState, HandlersPayloads[keyof HandlersPayloads]>(
  handlers as unknown as MarketHandlers<false>,
  initialState,
);
