import { Action, handleActions, ReducerMap } from "redux-actions";
import {
  AvailableProviderV3,
  Pair,
} from "@ledgerhq/live-common/exchange/swap/types";
import { SwapStateType } from "./types";
import {
  SwapActionTypes,
  SwapPayload,
  UpdateProvidersPayload,
  UpdateRatePayload,
  UpdateTransactionPayload,
} from "../actions/types";

export const INITIAL_STATE: SwapStateType = {
  providers: undefined,
  pairs: undefined,
  transaction: undefined,
  exchangeRate: undefined,
  exchangeRateExpiration: undefined,
};

export const ratesExpirationThreshold = 30000;

export const flattenPairs = (
  acc: Array<Pair>,
  value: AvailableProviderV3,
): Pair[] => [...acc, ...value.pairs];

export type UPDATE_PROVIDERS_TYPE = {
  payload: SwapStateType["providers"];
};

const handlers: ReducerMap<SwapStateType, SwapPayload> = {
  [SwapActionTypes.UPDATE_PROVIDERS]: (_state, action) => {
    const providers = (action as Action<UpdateProvidersPayload>).payload;
    const pairs = (providers || []).reduce(flattenPairs, []);

    return { ...INITIAL_STATE, providers, pairs };
  },
  [SwapActionTypes.UPDATE_TRANSACTION]: (state, action) => ({
    ...state,
    transaction: (action as Action<UpdateTransactionPayload>).payload,
  }),
  [SwapActionTypes.UPDATE_RATE]: (state, action) => {
    const payload = (action as Action<UpdateRatePayload>).payload;
    return {
      ...state,
      exchangeRate: payload,
      exchangeRateExpiration:
        payload?.tradeMethod === "fixed"
          ? new Date(new Date().getTime() + ratesExpirationThreshold)
          : undefined,
    };
  },
  RESET_STATE: () => ({ ...INITIAL_STATE }),
};

const options = { prefix: "SWAP" };

export default handleActions<SwapStateType, SwapPayload>(
  handlers,
  INITIAL_STATE,
  options,
);
