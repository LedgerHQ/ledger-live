import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface CryptoBannerState {
  isEnabled: boolean;
  autoScroll: boolean;
  scrollSpeed: number;
}

const initialState: CryptoBannerState = {
  isEnabled: true,
  autoScroll: true,
  scrollSpeed: 50,
};

export const cryptoBannerSlice = createSlice({
  name: "cryptoBanner",
  initialState,
  reducers: {
    toggleBanner: state => {
      state.isEnabled = !state.isEnabled;
    },
    setAutoScroll: (state, action: PayloadAction<boolean>) => {
      state.autoScroll = action.payload;
    },
    setScrollSpeed: (state, action: PayloadAction<number>) => {
      state.scrollSpeed = action.payload;
    },
  },
});

export const { toggleBanner, setAutoScroll, setScrollSpeed } = cryptoBannerSlice.actions;
export const cryptoBannerReducer = cryptoBannerSlice.reducer;
