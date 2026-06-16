import { createSlice } from "@reduxjs/toolkit";
import { cvsApi, resolveSupportedFiats } from "@domain/api-currencies";
import { SUPPORTED_FIATS_INITIAL_STATE } from "./schema";

const supportedFiatsSlice = createSlice({
  name: "supportedFiats",
  initialState: SUPPORTED_FIATS_INITIAL_STATE,
  reducers: {},
  extraReducers: builder => {
    builder.addMatcher(cvsApi.endpoints.getSupportedFiats.matchFulfilled, (state, action) => {
      state.supportedFiats = resolveSupportedFiats(action.payload);
    });
  },
});

/** Reducer for the `supportedFiats` slice — register under `state.supportedFiats`. */
export const supportedFiatsReducer = supportedFiatsSlice.reducer;
