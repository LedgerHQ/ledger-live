import { useCallback, useEffect, useMemo, useState } from "react";

type Params = Readonly<{
  /** Whether a legacy modal is open: the family activation flows are legacy modals. */
  isAnyModalOpen: boolean;
  /** Reads the `assetStatus` of the token again. */
  refresh: () => Promise<void>;
  setIsAddressVisible: (visible: boolean) => void;
}>;

/**
 * Runs a family activation flow and tells when it is over. The modals give no result back, so
 * the flow's close is the return: the receive dialog comes back and reads the token again.
 */
export function useAssetActivation({ isAnyModalOpen, refresh, setIsAddressVisible }: Params) {
  const [phase, setPhase] = useState<"idle" | "launched" | "open" | "returned">("idle");

  useEffect(() => {
    if (phase === "launched" && isAnyModalOpen) setPhase("open");
    if (phase === "open" && !isAnyModalOpen) {
      setPhase("returned");
      setIsAddressVisible(true);
      void refresh();
    }
  }, [phase, isAnyModalOpen, refresh, setIsAddressVisible]);

  const run = useCallback(
    (openFlow: () => void) => {
      setIsAddressVisible(false);
      setPhase("launched");
      openFlow();
    },
    [setIsAddressVisible],
  );

  return useMemo(() => ({ run, hasReturned: phase === "returned" }), [run, phase]);
}
