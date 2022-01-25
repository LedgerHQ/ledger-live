/* @flow */
import React, { useCallback } from "react";
import useEnv from "@ledgerhq/live-common/lib/hooks/useEnv";
import { setEnv } from "@ledgerhq/live-common/lib/env";
import SettingsRow from "../../../components/SettingsRow";
import Track from "../../../analytics/Track";
import Switch from "../../../components/Switch";

const AnalyticsConsoleRow = () => {
  const analyticsConsoleVisibility = useEnv("ANALYTICS_CONSOLE");
  const toggleAnalyticsConsole = useCallback(() => {
    setEnv("ANALYTICS_CONSOLE", !analyticsConsoleVisibility);
  }, [analyticsConsoleVisibility]);

  return (
    <SettingsRow
      event="AnalyticsConsoleRow"
      title="View analytics overlay"
      desc="Toggle analytics console, making tracked events visible as an overlay"
      onPress={null}
      alignedTop
    >
      <Track
        event={
          analyticsConsoleVisibility
            ? "EnableAnalyticsConsole"
            : "DisableAnalyticsConsole"
        }
        onUpdate
      />
      <Switch
        value={analyticsConsoleVisibility}
        onValueChange={toggleAnalyticsConsole}
      />
    </SettingsRow>
  );
};

export default AnalyticsConsoleRow;
