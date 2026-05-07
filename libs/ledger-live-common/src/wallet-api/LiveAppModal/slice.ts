import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { LiveAppModalParams, LiveAppModalState } from "./types";

const liveAppModalSlice = createSlice({
  name: "liveAppModal",
  initialState: null as LiveAppModalState,
  reducers: {
    setLiveAppModal: (_state, action: PayloadAction<LiveAppModalParams | null>) => action.payload,
  },
});

export const { setLiveAppModal } = liveAppModalSlice.actions;
export const liveAppModalReducer = liveAppModalSlice.reducer;
