import { configureStore } from "@reduxjs/toolkit";
import { cryptoAssetsApi } from "@ledgerhq/cryptoassets/cal-client";
import { accountsReducer } from "../data-layer/accounts/slice";
import { operationHistoryReducer } from "../data-layer/operationHistory/slice";
import { balanceHistoryReducer } from "../data-layer/balanceHistory/slice";
import { accountCoinResourcesReducer } from "../data-layer/accountCoinResources/slice";
import { transactionalReducer } from "../data-layer/transactional/slice";

export const store = configureStore({
  reducer: {
    accounts: accountsReducer,
    operationHistory: operationHistoryReducer,
    balanceHistory: balanceHistoryReducer,
    accountCoinResources: accountCoinResourcesReducer,
    transactional: transactionalReducer,
    [cryptoAssetsApi.reducerPath]: cryptoAssetsApi.reducer,
  },
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware().concat(cryptoAssetsApi.middleware),
  devTools: true,
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
