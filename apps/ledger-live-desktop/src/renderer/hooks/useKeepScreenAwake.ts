import { power } from "~/renderer/bridge";
import { useCallback, useEffect, useRef } from "react";

export const useKeepScreenAwake = (enabled: boolean) => {
  const blockerId = useRef(Number.NaN);

  const deactivateKeepAwake = useCallback(async () => {
    if (!Number.isNaN(blockerId.current)) {
      await power.release(blockerId.current);
      blockerId.current = Number.NaN;
    }
  }, []);

  const activateKeepAwake = useCallback(async () => {
    if (Number.isNaN(blockerId.current)) {
      blockerId.current = await power.keepScreenAwake();
    }
  }, []);

  useEffect(() => {
    if (enabled) {
      activateKeepAwake();
    } else {
      deactivateKeepAwake();
    }
  }, [activateKeepAwake, deactivateKeepAwake, enabled]);

  useEffect(() => {
    return () => {
      deactivateKeepAwake();
    };
  }, [deactivateKeepAwake]);
};
