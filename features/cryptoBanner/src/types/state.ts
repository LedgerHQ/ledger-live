import { cryptoBannerApi } from "../data-layer/api/cryptoBanner.api";

export interface RootState {
  cryptoBanner: {
    isEnabled: boolean;
    autoScroll: boolean;
    scrollSpeed: number;
  };
  [cryptoBannerApi.reducerPath]: ReturnType<typeof cryptoBannerApi.reducer>;
}
