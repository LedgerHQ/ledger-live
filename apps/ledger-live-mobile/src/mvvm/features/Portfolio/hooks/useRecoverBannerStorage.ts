import { useState, useEffect, useCallback } from "react";
import { getStoreValue, setStoreValue } from "~/store";
import { LedgerRecoverSubscriptionStateEnum } from "~/types/recoverSubscriptionState";

export type RecoverBannerState = {
  subscriptionState: LedgerRecoverSubscriptionStateEnum;
  displayBanner: boolean;
};

function useRecoverBannerStorage(protectId: string): {
  data: RecoverBannerState | undefined;
  dismissBanner: () => void;
} {
  const [data, setData] = useState<RecoverBannerState | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const subscriptionState = await getStoreValue<LedgerRecoverSubscriptionStateEnum>(
          "SUBSCRIPTION_STATE",
          protectId,
        );
        const displayBannerRaw = await getStoreValue<string>("DISPLAY_BANNER", protectId);
        if (!cancelled) {
          setData({
            subscriptionState:
              subscriptionState ?? LedgerRecoverSubscriptionStateEnum.NO_SUBSCRIPTION,
            displayBanner: displayBannerRaw === "true",
          });
        }
      } catch {
        // storage errors are non-fatal; banner simply won't show
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [protectId]);

  const dismissBanner = useCallback(() => {
    setStoreValue("DISPLAY_BANNER", "false", protectId);
    setData(prev => (prev ? { ...prev, displayBanner: false } : prev));
  }, [protectId]);

  return { data, dismissBanner };
}

export default useRecoverBannerStorage;
