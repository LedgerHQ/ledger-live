import { useCallback, useRef } from "react";
import {
  activateKeepAwakeAsync,
  deactivateKeepAwake as deactivateKeepAwakeExpo,
} from "expo-keep-awake";
import { v4 as uuid_v4 } from "uuid";

export function useKeepScreenAwake() {
  const blockerId = useRef("");

  const deactivateKeepScreenAwake = useCallback(async () => {
    if (blockerId.current) {
      await deactivateKeepAwakeExpo(blockerId.current);
      blockerId.current = "";
    }
  }, []);

  const activateKeepScreenAwake = useCallback(async () => {
    if (!blockerId.current) {
      blockerId.current = uuid_v4();
      await activateKeepAwakeAsync(blockerId.current);
    }
    return () => deactivateKeepScreenAwake();
  }, [deactivateKeepScreenAwake]);

  return { activateKeepScreenAwake, deactivateKeepScreenAwake };
}
