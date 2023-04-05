import { handleActions } from "redux-actions";
import {
  AvailableProviderV3,
  Transaction,
  ExchangeRate,
} from "@ledgerhq/live-common/exchange/swap/types";
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
export const ratesExpirationThreshold = 60000;
export const flattenPairs = (
  acc: Array<{
    from: string;
    to: string;
  }>,
  value: AvailableProviderV3,
) => [...acc, ...value.pairs];
export type UPDATE_PROVIDERS_TYPE = {
  payload: $NonMaybeType<SwapStateType["providers"]>;
};
const updateProviders = (state: SwapStateType, { payload: providers }: UPDATE_PROVIDERS_TYPE) => {
  const pairs = providers.reduce(flattenPairs, []);
  return {
    ...state,
    providers: providers,
    pairs,
  };
};
const handlers = {
  UPDATE_PROVIDERS: updateProviders,
  UPDATE_TRANSACTION: (
    state: SwapStateType,
    {
      payload,
    }: {
      payload: Transaction | undefined | null;
    },
  ) => ({
    ...state,
    transaction: payload,
  }),
  UPDATE_RATE: (
    state: SwapStateType,
    {
      payload,
    }: {
      payload: ExchangeRate | undefined | null;
    },
  ) => ({
    ...state,
    exchangeRate: payload,
    exchangeRateExpiration:
      payload?.tradeMethod === "fixed"
        ? new Date(new Date().getTime() + ratesExpirationThreshold)
        : null,
  }),
  RESET_STATE: () => ({
    ...initialState,
  }),
};
const options = {
  prefix: "SWAP",
};
export default handleActions(handlers, initialState, options);
