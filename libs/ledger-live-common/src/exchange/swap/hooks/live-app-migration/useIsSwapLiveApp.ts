import { useCallback, useState } from "react";

export function useIsSwapLiveApp() {
  const [, setHasCrashed] = useState(false);

  const onLiveAppCrashed = useCallback(() => setHasCrashed(true), []);

  return {
    enabled: true,
    onLiveAppCrashed,
  };
}
