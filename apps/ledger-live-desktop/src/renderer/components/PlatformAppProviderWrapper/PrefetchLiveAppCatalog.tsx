import { useEffect, useRef } from "react";
import { useRemoteLiveAppContext } from "@ledgerhq/live-common/platform/providers/RemoteLiveAppProvider/index";

export function PrefetchLiveAppCatalog(): null {
  const { state, updateManifests } = useRemoteLiveAppContext();
  const hasTriggeredRef = useRef(false);

  useEffect(() => {
    if (hasTriggeredRef.current) {
      return;
    }

    const isNotLoaded = state.value === null;
    const isNotLoading = !state.isLoading;
    if (isNotLoaded && isNotLoading) {
      hasTriggeredRef.current = true;
      updateManifests();
    }
  }, [state.value, state.isLoading, updateManifests]);

  return null;
}
