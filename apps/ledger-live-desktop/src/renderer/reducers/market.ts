import { handleActions } from "redux-actions";
import { Handlers } from "./types";
import { MarketListRequestParams, Order } from "@ledgerhq/live-common/market/utils/types";

export type MarketState = {
  marketParams: MarketListRequestParams;
  currentPage: number;
};

const initialState: MarketState = {
  marketParams: {
    range: "24h",
    limit: 50,
    starred: [],
    order: Order.MarketCapDesc,
    search: "",
    liveCompatible: false,
    page: 1,
    counterCurrency: "usd",
  },
  currentPage: 1,
};

type HandlersPayloads = {
  MARKET_SET_VALUES: MarketListRequestParams;
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
  MARKET_SET_CURRENT_PAGE: (state: MarketState, { payload }: { payload: number }) => ({
    ...state,
    currentPage: payload,
  }),
};

// Selectors

export const marketParamsSelector = (state: { market: MarketState }) => state.market.marketParams;
export const marketCurrentPageSelector = (state: { market: MarketState }) =>
  state.market.currentPage;
// Exporting reducer

export default handleActions<MarketState, HandlersPayloads[keyof HandlersPayloads]>(
  handlers as unknown as MarketHandlers<false>,
  initialState,
);
