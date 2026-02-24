import React, { useCallback } from "react";
import useEnv from "@ledgerhq/live-common/hooks/useEnv";
import { setEnv } from "@ledgerhq/live-env";
import SettingsRow from "~/components/SettingsRow";
import Switch from "~/components/Switch";

const JsThreadMonitorRow = () => {
  const jsThreadMonitor = useEnv("JS_THREAD_MONITOR");
  const toggleJsThreadMonitor = useCallback(() => {
    setEnv("JS_THREAD_MONITOR", !jsThreadMonitor);
  }, [jsThreadMonitor]);

  return (
    <SettingsRow
      title="JS thread monitor"
      desc="Toggle JS thread stall monitor overlay, showing thread responsiveness metrics."
    >
      <Switch value={jsThreadMonitor} onValueChange={toggleJsThreadMonitor} />
    </SettingsRow>
  );
};

export default JsThreadMonitorRow;
