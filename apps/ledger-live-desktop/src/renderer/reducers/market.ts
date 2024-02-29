import { handleActions } from "redux-actions";
import { Handlers } from "./types";

export type MarketState = {
  range?: string;
  limit?: number;
  ids?: string[];
  starred?: string[];
  orderBy?: string;
  order?: string;
  search?: string;
  liveCompatible?: boolean;
  page?: number;
  counterCurrency?: string;
};

const initialState: MarketState = {
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
};

type HandlersPayloads = {
  MARKET_SET_VALUES: MarketState;
};
type MarketHandlers<PreciseKey = true> = Handlers<MarketState, HandlersPayloads, PreciseKey>;

const handlers: MarketHandlers = {
  MARKET_SET_VALUES: (state: MarketState, { payload }: { payload: MarketState }) => ({
    ...state,
    ...payload,
  }),
};

// Selectors

export const marketSelector = (state: { market: MarketState }) => state.market;

// Exporting reducer

export default handleActions<MarketState, HandlersPayloads[keyof HandlersPayloads]>(
  handlers as unknown as MarketHandlers<false>,
  initialState,
);
