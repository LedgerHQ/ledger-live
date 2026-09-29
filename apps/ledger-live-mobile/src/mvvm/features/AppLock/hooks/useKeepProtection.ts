import { isLastProtection, selectAppLock, type Protection } from "@features/platform-app-lock";
import { getCardSessionToken } from "@features/platform-card";
import { useCallback, useState } from "react";
import { useSelector } from "~/context/hooks";

export type KeepProtection = Readonly<{
  isRefusing: boolean;
  onRefusalClose: () => void;
  allowRemoval: (protection: Protection) => Promise<boolean>;
}>;

// Asked when the user acts rather than when the screen mounts: an answer read ahead could still be
// pending when the tap lands, or stale once a session starts or ends with Settings open.
async function holdsCard(): Promise<boolean> {
  try {
    // A read that a new session lands in the middle of answers null too, so null is asked twice.
    for (let read = 0; read < 2; read++) {
      if ((await getCardSessionToken()) !== null) {
        return true;
      }
    }
    return false;
  } catch {
    // A refusal can be retried; a removal cannot be undone.
    return true;
  }
}

export function useKeepProtection(): KeepProtection {
  const protection = useSelector(selectAppLock);
  const [isRefusing, setIsRefusing] = useState(false);

  const allowRemoval = useCallback(
    async (removing: Protection) => {
      if (!isLastProtection(protection, removing) || !(await holdsCard())) {
        return true;
      }

      setIsRefusing(true);
      return false;
    },
    [protection],
  );

  const onRefusalClose = useCallback(() => setIsRefusing(false), []);

  return { isRefusing, onRefusalClose, allowRemoval };
}
