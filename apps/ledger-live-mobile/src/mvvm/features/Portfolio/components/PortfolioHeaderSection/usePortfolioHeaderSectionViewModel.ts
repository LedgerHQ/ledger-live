import { useSafeAreaInsets } from "react-native-safe-area-context";

interface PortfolioHeaderSectionViewModel {
  readonly safeAreaTop: number;
}

export function usePortfolioHeaderSectionViewModel(): PortfolioHeaderSectionViewModel {
  const { top: safeAreaTop } = useSafeAreaInsets();
  return { safeAreaTop };
}
