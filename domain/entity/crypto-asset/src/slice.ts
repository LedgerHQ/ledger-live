import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { CryptoAssetState, CurrencyId, Timestamp } from "./schema";

export const CRYPTO_ASSET_INITIAL_STATE: CryptoAssetState = {
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  supportedCurrencyIds: [] as CurrencyId[],
  lastSync: null,
};

const cryptoAssetSlice = createSlice({
  name: "cryptoAsset",
  initialState: CRYPTO_ASSET_INITIAL_STATE,
  reducers: {
    setSupportedCurrencyIds(state, action: PayloadAction<CurrencyId[]>) {
      state.supportedCurrencyIds = action.payload;
    },
    setLastSync(state, action: PayloadAction<Timestamp | null>) {
      state.lastSync = action.payload;
    },
    importState(_, action: PayloadAction<CryptoAssetState>) {
      return action.payload;
    },
  },
});

export const { setSupportedCurrencyIds, setLastSync, importState } = cryptoAssetSlice.actions;
export const cryptoAssetReducer = cryptoAssetSlice.reducer;
