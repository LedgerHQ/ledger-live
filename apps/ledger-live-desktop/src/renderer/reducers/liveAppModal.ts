import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type {
  LiveAppModalSize,
  LiveAppModalUseCase,
} from "@ledgerhq/live-common/wallet-api/LiveAppModal/types";
import type { State } from "~/renderer/reducers";

export type LiveAppModalParams = {
  requestId: string;
  manifestId: string;
  path: string;
  title?: string;
  description?: string;
  size?: LiveAppModalSize;
  useCase?: LiveAppModalUseCase;
};

export type LiveAppModalState = LiveAppModalParams | null;

const liveAppModalSlice = createSlice({
  name: "liveAppModal",
  initialState: null as LiveAppModalState,
  reducers: {
    setLiveAppModal: (_state, action: PayloadAction<LiveAppModalParams | null>) => action.payload,
  },
});

export const { setLiveAppModal } = liveAppModalSlice.actions;

export const selectLiveAppModal = (state: Pick<State, "liveAppModal">) => state.liveAppModal;

export default liveAppModalSlice.reducer;
