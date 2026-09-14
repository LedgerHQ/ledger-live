import { useEffect, useState } from "react";
import { AppState } from "react-native";
import { useIsFocused } from "@react-navigation/native";
import type { CryptoCurrency } from "@domain/entity-currency-crypto";
import { useAleoLiveBlockHeight as useSharedAleoLiveBlockHeight } from "@ledgerhq/live-common/families/aleo/react";

type Options = {
  fallbackHeight: number;
  enabled: boolean;
};

/**
 * Pauses the shared poll whenever the countdown is off screen — the account screen stays
 * mounted behind whatever is pushed on top of it, so focus and not mounting is what says
 * the countdown is being looked at.
 */
export function useAleoLiveBlockHeight(
  currency: CryptoCurrency,
  { fallbackHeight, enabled }: Options,
): number {
  const [isAppActive, setIsAppActive] = useState(AppState.currentState === "active");
  const isFocused = useIsFocused();

  useEffect(() => {
    const subscription = AppState.addEventListener("change", state =>
      setIsAppActive(state === "active"),
    );

    return () => subscription.remove();
  }, []);

  return useSharedAleoLiveBlockHeight(currency, {
    fallbackHeight,
    enabled,
    paused: !isAppActive || !isFocused,
  });
}
