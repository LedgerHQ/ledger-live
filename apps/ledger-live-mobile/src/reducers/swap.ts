import { handleActions } from "redux-actions";
import {
  AvailableProviderV3,
  ExchangeRate,
} from "@ledgerhq/live-common/exchange/swap/types";
import { Transaction } from "@ledgerhq/live-common/generated/types";

export type SwapStateType = {
  providers: AvailableProviderV3[] | undefined;
  pairs: AvailableProviderV3["pairs"] | undefined;
  transaction: Transaction | undefined;
  exchangeRate: ExchangeRate | undefined;
  exchangeRateExpiration: Date | undefined;
};

const initialState: SwapStateType = {
  providers: undefined,
  pairs: undefined,
  transaction: undefined,
  exchangeRate: undefined,
  exchangeRateExpiration: undefined,
};

export const ratesExpirationThreshold = 30000;

export const flattenPairs = (
  acc: Array<{ from: string; to: string }>,
  value: AvailableProviderV3,
) => [...acc, ...value.pairs];

export type UPDATE_PROVIDERS_TYPE = {
  payload: SwapStateType["providers"];
};
const updateProviders = (
  state: SwapStateType,
  { payload: providers }: UPDATE_PROVIDERS_TYPE,
) => {
  const pairs = (providers || []).reduce(flattenPairs, []);

  return { ...initialState, providers, pairs };
};

const handlers = {
  UPDATE_PROVIDERS: updateProviders,
  UPDATE_TRANSACTION: (
    state: SwapStateType,
    { payload }: { payload: Transaction | undefined },
  ) => ({
    ...state,
    transaction: payload,
  }),
  UPDATE_RATE: (
    state: SwapStateType,
    { payload }: { payload: ExchangeRate | undefined },
  ) => ({
    ...state,
    exchangeRate: payload,
    exchangeRateExpiration:
      payload?.tradeMethod === "fixed"
        ? new Date(new Date().getTime() + ratesExpirationThreshold)
        : null,
  }),
  RESET_STATE: () => ({ ...initialState }),
};

const options = { prefix: "SWAP" };

export default handleActions(handlers, initialState, options);
