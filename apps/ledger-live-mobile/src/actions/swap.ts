import { createAction } from "redux-actions";
import { Transaction } from "@ledgerhq/live-common/generated/types";
import { ExchangeRate } from "@ledgerhq/live-common/exchange/swap/types";
import { State } from "../reducers/types";

/* ACTIONS */

export const updateTransactionAction = createAction<Transaction | null | undefined>(
  "SWAP/UPDATE_TRANSACTION",
);
export const updateRateAction = createAction<ExchangeRate | null | undefined>("SWAP/UPDATE_RATE");

/* SELECTORS */
export const rateSelector = (state: State) => state.swap.exchangeRate;
export const rateExpirationSelector = (state: State) => state.swap.exchangeRateExpiration;
