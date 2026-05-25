import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export const SWAP_SLICE_NAME = "swap";

export interface SwapState {
  clickCount: number;
  lastClickedAt: string | null;
}

export const INITIAL_STATE: SwapState = {
  clickCount: 0,
  lastClickedAt: null,
};

const swapSlice = createSlice({
  name: SWAP_SLICE_NAME,
  initialState: INITIAL_STATE,
  reducers: {
    recordSwapClick: (state, action: PayloadAction<{ at: string }>) => {
      state.clickCount += 1;
      state.lastClickedAt = action.payload.at;
    },
    resetSwap: () => INITIAL_STATE,
  },
});

export const { recordSwapClick, resetSwap } = swapSlice.actions;

export const swapStateSelector = (state: { swap?: SwapState }): SwapState =>
  state.swap ?? INITIAL_STATE;

export default swapSlice.reducer;
