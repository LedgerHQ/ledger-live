import React, { useCallback } from "react";
import useEnv from "@ledgerhq/live-common/hooks/useEnv";
import { setEnv } from "@ledgerhq/live-env";
import SettingsRow from "~/components/SettingsRow";
import Switch from "~/components/Switch";

const PerformanceConsoleRow = () => {
  const performanceConsoleVisibility = useEnv("PERFORMANCE_CONSOLE");
  const togglePerformanceConsole = useCallback(() => {
    setEnv("PERFORMANCE_CONSOLE", !performanceConsoleVisibility);
  }, [performanceConsoleVisibility]);
  return (
    <SettingsRow title="Performance overlay" desc="Toggle performance console">
      <Switch value={performanceConsoleVisibility} onValueChange={togglePerformanceConsole} />
    </SettingsRow>
  );
};

export default PerformanceConsoleRow;
