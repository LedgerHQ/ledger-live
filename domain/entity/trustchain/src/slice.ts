import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import {
  initialTrustchainState,
  type Trustchain,
  type TrustchainMemberKey,
  type TrustchainState,
} from "./schema";

export const trustchainSlice = createSlice({
  name: "trustchain",
  initialState: initialTrustchainState,
  reducers: {
    importTrustchainState: (_state, { payload }: PayloadAction<TrustchainState>) => payload,
    resetTrustchainState: () => initialTrustchainState,
    setTrustchain: (state, { payload }: PayloadAction<Trustchain>) => {
      state.trustchain = payload;
    },
    setMemberKey: (state, { payload }: PayloadAction<TrustchainMemberKey>) => {
      state.memberKey = payload;
    },
  },
});

export const { importTrustchainState, resetTrustchainState, setTrustchain, setMemberKey } =
  trustchainSlice.actions;
