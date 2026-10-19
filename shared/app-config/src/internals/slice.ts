import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { AppConfigState, ConfigOptionId } from "../types";
import { isDeclaredOption, isDeclaredSwitch } from "./options";

const initialState: AppConfigState = { session: null, savedSelections: {} };

export const appConfigSlice = createSlice({
  name: "appConfig",
  initialState,
  reducers: {
    /** Dispatched by `createAppConfigMiddleware` only: the session never changes once set. */
    setSession(state, { payload }: PayloadAction<NonNullable<AppConfigState["session"]>>) {
      state.session = payload;
      state.savedSelections = payload.selections;
    },
    selectOption(
      state,
      {
        payload: { switchId, optionId },
      }: PayloadAction<{ switchId: string; optionId: ConfigOptionId }>,
    ) {
      if (state.session && isDeclaredOption(state.session.switches, switchId, optionId)) {
        state.savedSelections[switchId] = optionId;
      }
    },
    resetSwitch(state, { payload: switchId }: PayloadAction<string>) {
      if (state.session && isDeclaredSwitch(state.session.switches, switchId)) {
        delete state.savedSelections[switchId];
      }
    },
  },
});

export const { setSession } = appConfigSlice.actions;
