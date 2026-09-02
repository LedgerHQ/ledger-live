import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { PayCardLoginIntroState } from "./types";

export const payCardLoginIntroInitialState: PayCardLoginIntroState = {
  hasSeenLoginIntro: false,
};

export const payCardLoginIntroSlice = createSlice({
  name: "payCardLoginIntro",
  initialState: payCardLoginIntroInitialState,
  reducers: {
    markPayCardLoginIntroSeen: state => {
      state.hasSeenLoginIntro = true;
    },
    resetPayCardLoginIntroSeen: state => {
      state.hasSeenLoginIntro = false;
    },
    restorePayCardLoginIntro: (
      state,
      action: PayloadAction<Partial<PayCardLoginIntroState> | undefined>,
    ) => {
      const { hasSeenLoginIntro } = action.payload ?? {};
      if (typeof hasSeenLoginIntro === "boolean") {
        state.hasSeenLoginIntro = hasSeenLoginIntro;
      }
    },
  },
});

export const { markPayCardLoginIntroSeen, resetPayCardLoginIntroSeen, restorePayCardLoginIntro } =
  payCardLoginIntroSlice.actions;
