import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { AppConfigState, ConfigSelectionId, RejectedDevValue } from "../types";
import { acceptsDevValue, isAllowedSelection, isSelectable } from "./options";

const initialState: AppConfigState = {
  session: null,
  savedSelections: {},
  savedDevValues: {},
  devValueErrors: {},
};

export const appConfigSlice = createSlice({
  name: "appConfig",
  initialState,
  reducers: {
    /** Dispatched by `createAppConfigMiddleware` only: the session never changes once set. */
    setSession: (_, { payload }: PayloadAction<NonNullable<AppConfigState["session"]>>) => ({
      session: payload,
      savedSelections: payload.selections,
      savedDevValues: payload.devValues,
      devValueErrors: {},
    }),
    selectOption(
      state,
      {
        payload: { id, selectionId },
      }: PayloadAction<{ id: string; selectionId: ConfigSelectionId }>,
    ) {
      if (state.session && isAllowedSelection(state.session, id, selectionId)) {
        state.savedSelections[id] = selectionId;
      }
    },
    resetSelection(state, { payload: id }: PayloadAction<string>) {
      if (state.session && isSelectable(state.session, id)) {
        delete state.savedSelections[id];
      }
    },
    setDevValue(
      state,
      { payload: { name, value } }: PayloadAction<{ name: string; value: string }>,
    ) {
      if (state.session && acceptsDevValue(state.session, name)) {
        state.savedDevValues[name] = value;
        delete state.devValueErrors[name];
      }
    },
    removeDevValue(state, { payload: name }: PayloadAction<string>) {
      if (state.session && acceptsDevValue(state.session, name)) {
        delete state.savedDevValues[name];
        delete state.devValueErrors[name];
      }
    },
    /** Dispatched by `createAppConfigMiddleware` only, in place of a dev value it refused to save. */
    rejectDevValue(
      state,
      { payload: { name, ...rejected } }: PayloadAction<RejectedDevValue & { name: string }>,
    ) {
      if (state.session && acceptsDevValue(state.session, name)) {
        state.devValueErrors[name] = rejected;
      }
    },
  },
});

export const { setSession, rejectDevValue } = appConfigSlice.actions;
