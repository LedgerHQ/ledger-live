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
  const buySellLoaderFF = useFeature("buySellLoader");
  const durationMs = buySellLoaderFF?.params?.durationMs ?? 0;
  const internalAppIds = useInternalAppIds() || INTERNAL_APP_IDS;
  const isAppInternal = internalAppIds.includes(manifest.id);
  const isEnabled = buySellLoaderFF?.enabled && !isAppInternal;

  const [extendedInitialLoading, setExtendedInitialLoading] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showProviderLoadingTransition = isEnabled && (isLoading || extendedInitialLoading);

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

  return showProviderLoadingTransition;
}
