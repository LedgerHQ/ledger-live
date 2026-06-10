import { useContext, useLayoutEffect } from "react";
import { DeviceIntentExecutorHeaderContext } from "../utils/DeviceIntentExecutorHeaderContext";

export function useDeviceIntentExecutorHeaderOverride(): boolean {
  const context = useContext(DeviceIntentExecutorHeaderContext);

  useLayoutEffect(() => {
    if (!context) return;

    return context.requestHeaderOverride();
  }, [context]);

  return Boolean(context);
}
