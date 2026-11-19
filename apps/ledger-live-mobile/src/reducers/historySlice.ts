import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type HistoryState = {
  lastSeenOperationDate: string | null;
};

export const INITIAL_STATE: HistoryState = {
  lastSeenOperationDate: null,
};

const historySlice = createSlice({
  name: "history",
  initialState: INITIAL_STATE,
  reducers: {
    markOperationsAsSeen: {
      reducer: (state, action: PayloadAction<string>) => {
        state.lastSeenOperationDate = action.payload;
      },
      prepare: () => ({ payload: new Date().toISOString() }),
    },
    initHistory: (_, action: PayloadAction<HistoryState>) => action.payload,
  },
});

export const { markOperationsAsSeen, initHistory } = historySlice.actions;

export default historySlice.reducer;
