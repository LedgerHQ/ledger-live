import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { MockServerOverlayMode, MockServerOverlayState } from "./types";

export const mockServerOverlayInitialState: MockServerOverlayState = {
  mode: { type: "hidden" },
  deviceScreenWidth: 280,
  isFloatingButtonHidden: false,
};

export const mockServerOverlaySlice = createSlice({
  name: "mockServerOverlay",
  initialState: mockServerOverlayInitialState,
  reducers: {
    setMockServerOverlayMode: (state, action: PayloadAction<MockServerOverlayMode>) => {
      state.mode = action.payload;
    },
    setMockServerDeviceScreenWidth: (state, action: PayloadAction<number>) => {
      state.deviceScreenWidth = action.payload;
    },
    setMockServerFloatingButtonHidden: (state, action: PayloadAction<boolean>) => {
      state.isFloatingButtonHidden = action.payload;
    },
  },
  selectors: {
    selectMockServerOverlayMode: state => state.mode,
    selectMockServerDeviceScreenWidth: state => state.deviceScreenWidth,
    selectIsMockServerFloatingButtonHidden: state => state.isFloatingButtonHidden,
  },
});

export const {
  setMockServerOverlayMode,
  setMockServerDeviceScreenWidth,
  setMockServerFloatingButtonHidden,
} = mockServerOverlaySlice.actions;

export const {
  selectMockServerOverlayMode,
  selectMockServerDeviceScreenWidth,
  selectIsMockServerFloatingButtonHidden,
} = mockServerOverlaySlice.selectors;
