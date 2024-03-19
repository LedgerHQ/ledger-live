import { Action, handleActions, ReducerMap } from "redux-actions";
import { DEFAULT_SWAP_RATES_INTERVAL_MS } from "@ledgerhq/live-common/exchange/swap/const/timeout";
import { AvailableProviderV3, Pair } from "@ledgerhq/live-common/exchange/swap/types";
import { SwapStateType } from "./types";
import {
  SwapActionTypes,
  SwapPayload,
  UpdateProvidersPayload,
  UpdateRatePayload,
  UpdateTransactionPayload,
  DangerouslyOverrideStatePayload,
} from "../actions/types";

export const INITIAL_STATE: SwapStateType = {
  providers: undefined,
  pairs: undefined,
  transaction: undefined,
  exchangeRate: undefined,
  exchangeRateExpiration: undefined,
};

export const flattenPairs = (acc: Array<Pair>, value: AvailableProviderV3): Pair[] => [
  ...acc,
  ...value.pairs,
];

export type UPDATE_PROVIDERS_TYPE = {
  payload: SwapStateType["providers"];
};

const handlers: ReducerMap<SwapStateType, SwapPayload> = {
  [SwapActionTypes.UPDATE_PROVIDERS]: (_state, action) => {
    const providers = (action as Action<UpdateProvidersPayload>).payload;
    const pairs = (providers || []).reduce(flattenPairs, []);

    return { ...INITIAL_STATE, providers, pairs };
  },
  [SwapActionTypes.UPDATE_TRANSACTION]: (state, action) => {
    const payload = (action as Action<UpdateTransactionPayload>).payload;
    return {
      ...state,
      transaction: payload,
    };
  },
  [SwapActionTypes.UPDATE_RATE]: (state, action) => {
    const payload = (action as Action<UpdateRatePayload>).payload;
    return {
      ...state,
      exchangeRate: payload,
      exchangeRateExpiration:
        payload?.tradeMethod === "fixed"
          ? new Date(new Date().getTime() + DEFAULT_SWAP_RATES_INTERVAL_MS)
          : undefined,
    };
  },

  [SwapActionTypes.DANGEROUSLY_OVERRIDE_STATE]: (state, action): SwapStateType => ({
    ...state,
    ...(action as Action<DangerouslyOverrideStatePayload>).payload.swap,
  }),

  RESET_STATE: () => ({ ...INITIAL_STATE }),
};

const options = { prefix: "SWAP" };

export default handleActions<SwapStateType, SwapPayload>(handlers, INITIAL_STATE, options);
