import { useCallback, useMemo, useState } from "react";
import type { VerifyAddressOutcome, VerifyAddressSelection } from "../types";

export type UseVerifyAddressFlowParams = Readonly<{
  onCloseFlow: () => void;
}>;

export type VerifyAddressFlow = Readonly<{
  active: boolean;
  selection: VerifyAddressSelection | null;
  /** Mounts the device verification right away, without an intro step. */
  start: (selection: VerifyAddressSelection) => void;
  /** Unmounts it: back to the address screen, or out of the receive flow on `mismatch`. */
  onExit: (outcome: VerifyAddressOutcome) => void;
}>;

export function useVerifyAddressFlow({
  onCloseFlow,
}: UseVerifyAddressFlowParams): VerifyAddressFlow {
  const [selection, setSelection] = useState<VerifyAddressSelection | null>(null);

  const start = useCallback((next: VerifyAddressSelection) => setSelection(next), []);

  const onExit = useCallback(
    (outcome: VerifyAddressOutcome) => {
      setSelection(null);
      if (outcome === "mismatch") onCloseFlow();
    },
    [onCloseFlow],
  );

  return useMemo(
    () => ({ active: selection !== null, selection, start, onExit }),
    [selection, start, onExit],
  );
}
