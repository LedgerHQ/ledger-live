import { createSlice } from "@reduxjs/toolkit";
import type { State } from "~/reducers/types";

export type PostOnboardingHubDrawerState = {
  isOpen: boolean;
};

export const INITIAL_STATE: PostOnboardingHubDrawerState = {
  isOpen: false,
};

export const postOnboardingHubDrawerSelector = (state: State) => state.postOnboardingHubDrawer;

const postOnboardingHubDrawerSlice = createSlice({
  name: "postOnboardingHubDrawer",
  initialState: INITIAL_STATE,
  reducers: {
    openPostOnboardingHubDrawer: state => {
      state.isOpen = true;
    },
    closePostOnboardingHubDrawer: state => {
      state.isOpen = false;
    },
  },
});

export const { openPostOnboardingHubDrawer, closePostOnboardingHubDrawer } =
  postOnboardingHubDrawerSlice.actions;

export default postOnboardingHubDrawerSlice.reducer;
