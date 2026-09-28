import { AppState, type AppStateStatus } from "react-native";
import { useEffect, useRef } from "react";
import {
  formatCardAssetCryptoAmount,
  useCardAssetsViewModel as useCardAssetsViewModelBase,
} from "./useCardAssetsViewModelBase";
import type { CardAssetsProps, CardAssetsViewModel } from "./types";

export { formatCardAssetCryptoAmount };

export function useCardAssetsViewModel(props?: CardAssetsProps): CardAssetsViewModel {
  const viewModel = useCardAssetsViewModelBase(props);
  const { onRetryPress } = viewModel;
  const previousAppState = useRef<AppStateStatus>(AppState.currentState ?? "active");

  useEffect(() => {
    const subscription = AppState.addEventListener("change", nextAppState => {
      const resumed = previousAppState.current !== "active" && nextAppState === "active";
      previousAppState.current = nextAppState;

      if (resumed) onRetryPress();
    });

    return () => subscription.remove();
  }, [onRetryPress]);

  return viewModel;
}
