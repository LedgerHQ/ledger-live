import { ipcRenderer } from "electron";
import { useCallback, useRef } from "react";

export const useKeepScreenAwake = () => {
  const blockerId = useRef(Number.NaN);

  const deactivateKeepAwake = useCallback(async () => {
    if (!Number.isNaN(blockerId.current)) {
      await ipcRenderer.invoke("deactivate-keep-screen-awake", blockerId.current);
      blockerId.current = Number.NaN;
    }
  }, [blockerId]);

  const activateKeepAwake = useCallback(async () => {
    if (Number.isNaN(blockerId.current)) {
      blockerId.current = await ipcRenderer.invoke("activate-keep-screen-awake");
    }
    return () => deactivateKeepAwake();
  }, [deactivateKeepAwake]);

  return { activateKeepAwake, deactivateKeepAwake };
};
