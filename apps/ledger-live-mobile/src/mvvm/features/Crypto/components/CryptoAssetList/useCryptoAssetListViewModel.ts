import { useMemo } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GRADIENT_HEIGHT } from "LLM/components/BottomFadeGradient";

const HORIZONTAL_PADDING = 8;

interface CryptoAssetListViewModelResult {
  contentContainerStyle: { paddingHorizontal: number; paddingBottom: number };
}

export function useCryptoAssetListViewModel(): CryptoAssetListViewModelResult {
  const { bottom } = useSafeAreaInsets();

  const contentContainerStyle = useMemo(
    () => ({ paddingHorizontal: HORIZONTAL_PADDING, paddingBottom: GRADIENT_HEIGHT + bottom }),
    [bottom],
  );

  return { contentContainerStyle };
}
