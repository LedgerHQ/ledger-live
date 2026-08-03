import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { RecentAddressesState } from "./schema";

export const recentAddressesSlice = createSlice({
  name: "recentAddresses",
  initialState: {} as RecentAddressesState,
  reducers: {
    updateRecentAddresses: (
      _state,
      { payload }: PayloadAction<RecentAddressesState>,
    ): RecentAddressesState => payload,
  },
});

export const { updateRecentAddresses } = recentAddressesSlice.actions;
