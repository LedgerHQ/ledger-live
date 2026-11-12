import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type FocusSource = Readonly<{ addListener: (event: "focus", listener: () => void) => () => void }>;

/**
 * Runs a family activation flow and tells when it is over. Its success and cancel both pop back
 * to the receive screen, so the next focus is the return: the token is read again.
 */
export function useAssetActivation(navigation: FocusSource, refresh: () => Promise<void>) {
  const [hasReturned, setHasReturned] = useState(false);
  const isRunningRef = useRef(false);

  useEffect(
    () =>
      navigation.addListener("focus", () => {
        if (!isRunningRef.current) return;
        isRunningRef.current = false;
        setHasReturned(true);
        void refresh();
      }),
    [navigation, refresh],
  );

  const run = useCallback((openFlow: () => void) => {
    isRunningRef.current = true;
    openFlow();
  }, []);

  return useMemo(() => ({ run, hasReturned }), [run, hasReturned]);
}
