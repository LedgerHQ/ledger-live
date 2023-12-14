import { handleActions } from "redux-actions";
import { DEFAULT_SWAP_RATES_INTERVAL_MS } from "@ledgerhq/live-common/exchange/swap/const/timeout";
import { AvailableProviderV3, Pair, ExchangeRate } from "@ledgerhq/live-common/exchange/swap/types";

import { Transaction } from "@ledgerhq/live-common/generated/types";
import { Handlers } from "./types";

export type SwapStateType = {
  providers: Array<AvailableProviderV3> | undefined | null;
  pairs: AvailableProviderV3["pairs"] | undefined | null;
  transaction: Transaction | undefined | null;
  exchangeRate: ExchangeRate | undefined | null;
  exchangeRateExpiration: Date | undefined | null;
};
const initialState: SwapStateType = {
  providers: null,
  pairs: null,
  transaction: null,
  exchangeRate: null,
  exchangeRateExpiration: null,
};

type HandlersPayloads = {
  UPDATE_PROVIDERS: NonNullable<SwapStateType["providers"]>;
  UPDATE_TRANSACTION: Transaction | undefined | null;
  UPDATE_RATE: ExchangeRate | undefined | null;
  RESET_STATE: never;
};

type SwapHandlers<PreciseKey = true> = Handlers<SwapStateType, HandlersPayloads, PreciseKey>;

export const flattenPairs = (acc: Array<Pair>, value: AvailableProviderV3) => [
  ...acc,
  ...value.pairs,
];

const handlers: SwapHandlers = {
  UPDATE_PROVIDERS: (state, { payload: providers }) => {
    const pairs = providers.reduce(flattenPairs, []);
    return {
      ...state,
      providers: providers,
      pairs,
    };
  },
  UPDATE_TRANSACTION: (state, { payload }) => ({
    ...state,
    transaction: payload,
  }),
  UPDATE_RATE: (state, { payload }) => ({
    ...state,
    exchangeRate: payload,
    exchangeRateExpiration:
      payload?.tradeMethod === "fixed"
        ? new Date(new Date().getTime() + DEFAULT_SWAP_RATES_INTERVAL_MS)
        : null,
  }),
  RESET_STATE: () => ({
    ...initialState,
  }),
};
const options = {
  prefix: "SWAP",
};

export default handleActions<SwapStateType, HandlersPayloads[keyof HandlersPayloads]>(
  handlers as unknown as SwapHandlers<false>,
  initialState,
  options,
);
