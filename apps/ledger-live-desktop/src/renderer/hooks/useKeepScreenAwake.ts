import { ipcRenderer } from "electron";
import { useCallback, useEffect, useRef } from "react";

export const useKeepScreenAwake = () => {
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
    return () => {
      deactivateKeepAwake();
    };
  }, [deactivateKeepAwake]);

  return { activateKeepAwake, deactivateKeepAwake };
};
