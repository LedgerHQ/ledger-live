import { useMemo } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  type AssetListSharedState,
  useAssetListSharedState,
} from "LLM/components/AssetListItem/usePrecomputedAssetListData";

const HORIZONTAL_PADDING = 8;

interface CryptoAssetListViewModelResult {
  sharedState: AssetListSharedState;
  contentContainerStyle: { paddingHorizontal: number; paddingBottom: number };
}

export function useCryptoAssetListViewModel(): CryptoAssetListViewModelResult {
  const { bottom } = useSafeAreaInsets();
  const sharedState = useAssetListSharedState();

  const contentContainerStyle = useMemo(
    () => ({ paddingHorizontal: HORIZONTAL_PADDING, paddingBottom: bottom }),
    [bottom],
  );

  return { sharedState, contentContainerStyle };
}
