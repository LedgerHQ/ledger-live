import { handleActions } from "redux-actions";
import {
  AvailableProviderV3,
  ExchangeRate,
} from "@ledgerhq/live-common/exchange/swap/types";
import { Transaction } from "@ledgerhq/live-common/generated/types";

export type SwapStateType = {
  providers: AvailableProviderV3[] | null | undefined;
  pairs: AvailableProviderV3["pairs"] | null | undefined;
  transaction: Transaction | null | undefined;
  exchangeRate: ExchangeRate | null | undefined;
  exchangeRateExpiration: Date | null | undefined;
};

const initialState: SwapStateType = {
  providers: undefined,
  pairs: undefined,
  transaction: undefined,
  exchangeRate: undefined,
  exchangeRateExpiration: undefined,
};

export const ratesExpirationThreshold = 60000;

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
    { payload }: { payload: Transaction | null | undefined },
  ) => ({
    ...state,
    transaction: payload,
  }),
  UPDATE_RATE: (
    state: SwapStateType,
    { payload }: { payload: ExchangeRate | null | undefined },
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
