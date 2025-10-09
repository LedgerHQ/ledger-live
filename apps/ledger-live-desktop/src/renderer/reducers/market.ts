import { handleActions } from "redux-actions";
import { Handlers } from "./types";
import { MarketListRequestParams, Order } from "@ledgerhq/live-common/market/utils/types";

export type MarketState = {
  marketParams: MarketListRequestParams;
};

const initialState: MarketState = {
  marketParams: {
    range: "24h",
    limit: 50,
    starred: [],
    order: Order.MarketCapDesc,
    search: "",
    liveCompatible: false,
    counterCurrency: "USD",
  },
};

type HandlersPayloads = {
  MARKET_IMPORT_STATE: MarketState;
  MARKET_SET_VALUES: MarketListRequestParams;
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

  MARKET_IMPORT_STATE: (state, { payload }: { payload: MarketState }) => ({
    ...state,
    marketParams: {
      ...state.marketParams,
      range: payload.marketParams.range,
      counterCurrency: payload.marketParams.counterCurrency,
      order: payload.marketParams.order,
    },
  }),
};

// Selectors

export const marketParamsSelector = (state: { market: MarketState }) => state.market.marketParams;

export const marketStoreSelector = (state: { market: MarketState }) => state.market;

// Exporting reducer

export default handleActions<MarketState, HandlersPayloads[keyof HandlersPayloads]>(
  handlers as unknown as MarketHandlers<false>,
  initialState,
);
