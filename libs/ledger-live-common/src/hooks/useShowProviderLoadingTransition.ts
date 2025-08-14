import { useEffect, useRef, useState } from "react";

import { useFeature } from "../featureFlags/index";
import { INTERNAL_APP_IDS } from "../wallet-api/constants";
import { useInternalAppIds } from "./useInternalAppIds";
import { LiveAppManifest } from "../platform/types";

export function useShowProviderLoadingTransition({
  isLoading,
  manifest,
}: {
  manifest: LiveAppManifest;
  isLoading: boolean;
}) {
  const isEnabled = useProviderInterstitalEnabled({ manifest });
  const [extendedInitialLoading, setExtendedInitialLoading] = useState(false);

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const buySellLoaderFF = useFeature("buySellLoader");
  const durationMs = buySellLoaderFF?.params?.durationMs ?? 0;
  const internalAppIds = useInternalAppIds() || INTERNAL_APP_IDS;
  const isAppInternal = internalAppIds.includes(manifest.id);

  useEffect(() => {
    if (isEnabled && isLoading && !extendedInitialLoading) {
      setExtendedInitialLoading(true);

      if (timeoutRef.current) clearTimeout(timeoutRef.current);

      timeoutRef.current = setTimeout(() => {
        setExtendedInitialLoading(false);
      }, durationMs);
    }
  }, [durationMs, extendedInitialLoading, isAppInternal, isEnabled, isLoading]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return isEnabled && (isLoading || extendedInitialLoading);
}

export function useProviderInterstitalEnabled({ manifest }: { manifest?: LiveAppManifest }) {
  const buySellLoaderFF = useFeature("buySellLoader");
  const internalAppIds = useInternalAppIds() || INTERNAL_APP_IDS;

  if (!manifest) {
    return false;
  }

  const isAppInternal = internalAppIds.includes(manifest.id);
  const isEnabled = buySellLoaderFF?.enabled && !isAppInternal;

  return isEnabled;
}
