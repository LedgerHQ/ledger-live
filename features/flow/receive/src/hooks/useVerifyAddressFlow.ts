import { useCallback, useMemo, useState } from "react";
import type { VerifyAddressOutcome, VerifyAddressSelection } from "../types";

export type VerifyAddressFlow = Readonly<{
  active: boolean;
  selection: VerifyAddressSelection | null;
  /** Mounts the device verification right away, without an intro step. Ignored while active. */
  start: (selection: VerifyAddressSelection) => void;
  /** Unmounts it, back to the address screen, however it ended. */
  onExit: (outcome: VerifyAddressOutcome) => void;
}>;

export function useVerifyAddressFlow(): VerifyAddressFlow {
  const [selection, setSelection] = useState<VerifyAddressSelection | null>(null);

  const start = useCallback(
    (next: VerifyAddressSelection) => setSelection(current => current ?? next),
    [],
  );

  const onExit = useCallback(() => setSelection(null), []);

  return useMemo(
    () => ({ active: selection !== null, selection, start, onExit }),
    [selection, start, onExit],
  );
}
