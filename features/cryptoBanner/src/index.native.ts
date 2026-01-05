// Entry point for React Native
export { CryptoBanner } from "./components/CryptoBanner/index.native";
export { cryptoBannerApi, useGetTopCryptosQuery } from "./data-layer/api/cryptoBanner.api";
export {
  cryptoBannerReducer,
  toggleBanner,
  setAutoScroll,
  setScrollSpeed,
} from "./data-layer/entities/cryptoBanner/cryptoBannerSlice";
export {
  selectIsEnabled,
  selectAutoScroll,
  selectScrollSpeed,
} from "./data-layer/entities/cryptoBanner/cryptoBannerSelectors";
export { useCryptoBanner } from "./hooks/useCryptoBanner";
export type { TopCrypto, GetTopCryptosParams } from "./data-layer/api/types";
export { CRYPTO_BANNER_ROUTES } from "./routes";
