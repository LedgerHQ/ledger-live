import React, { useCallback } from "react";
import useEnv from "@shared/live-env/hooks";
import { setEnv } from "@shared/live-env";
import SettingsRow from "~/components/SettingsRow";
import Switch from "~/components/Switch";

const ThemeToggleRow = () => {
  const debugThemeVisibility = useEnv("DEBUG_THEME");
  const toggleDebugThemeVisibility = useCallback(() => {
    setEnv("DEBUG_THEME", !debugThemeVisibility);
  }, [debugThemeVisibility]);

  return (
    <SettingsRow
      title={"Debug theme"}
      desc="Toggle debug theme UI, allowing for easy theme changes."
    >
      <Switch value={debugThemeVisibility} onValueChange={toggleDebugThemeVisibility} />
    </SettingsRow>
  );
};

export default ThemeToggleRow;
