import { useEffect, useState } from "react";

export const STUCK_DEVICE_ACTION_HINT_DELAY_MS = 10_000;

/**
 * Returns true once `enabled` has been continuously true for
 * STUCK_DEVICE_ACTION_HINT_DELAY_MS, false otherwise. Resets whenever
 * `enabled` flips false or the component unmounts.
 */
export function useStuckDeviceActionHint(enabled: boolean): boolean {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setShow(false);
      return;
    }
    const id = setTimeout(() => setShow(true), STUCK_DEVICE_ACTION_HINT_DELAY_MS);
    return () => clearTimeout(id);
  }, [enabled]);

  return show;
}
