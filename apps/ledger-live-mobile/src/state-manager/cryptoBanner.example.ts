import { configureStore } from "@reduxjs/toolkit";
import { cryptoBannerApi, cryptoBannerReducer } from "@ledgerhq/crypto-banner";

export const configureCryptoBannerStore = () => {
  return configureStore({
    reducer: {
      cryptoBanner: cryptoBannerReducer,
      [cryptoBannerApi.reducerPath]: cryptoBannerApi.reducer,
    },
    middleware: getDefaultMiddleware => getDefaultMiddleware().concat(cryptoBannerApi.middleware),
  });
};
