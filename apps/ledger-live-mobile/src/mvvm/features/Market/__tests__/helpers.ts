import { State } from "~/reducers/types";

type MarketOverrides = Omit<Partial<State["market"]>, "marketParams"> & {
  marketParams?: Partial<State["market"]["marketParams"]>;
};

export const withMarketState = (overrides: MarketOverrides = {}) => ({
  overrideInitialState: (state: State) => ({
    ...state,
    market: {
      ...state.market,
      ...overrides,
      marketParams: {
        ...state.market.marketParams,
        ...overrides.marketParams,
      },
    },
  }),
});
