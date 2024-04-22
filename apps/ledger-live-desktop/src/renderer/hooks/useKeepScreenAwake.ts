import { ipcRenderer } from "electron";
import { useCallback, useEffect, useRef } from "react";

export const useKeepScreenAwake = (enabled: boolean) => {
  const blockerId = useRef(Number.NaN);

  const deactivateKeepAwake = useCallback(async () => {
    if (!Number.isNaN(blockerId.current)) {
      await ipcRenderer.invoke("deactivate-keep-screen-awake", blockerId.current);
      blockerId.current = Number.NaN;
    }
  }, []);

  const activateKeepAwake = useCallback(async () => {
    if (Number.isNaN(blockerId.current)) {
      blockerId.current = await ipcRenderer.invoke("activate-keep-screen-awake");
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
