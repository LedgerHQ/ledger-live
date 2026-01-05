import { RootState } from "../../../types/state";

export const selectIsEnabled = (state: RootState) => state.cryptoBanner.isEnabled;
export const selectAutoScroll = (state: RootState) => state.cryptoBanner.autoScroll;
export const selectScrollSpeed = (state: RootState) => state.cryptoBanner.scrollSpeed;
