import useEnv from "@ledgerhq/live-common/hooks/useEnv";
import { setEnv } from "@ledgerhq/live-env";
import React, { useCallback } from "react";
import { Switch } from "@ledgerhq/ldls-ui-react";

const EnableThemeConsole = () => {
  const env = useEnv("DEBUG_THEME");

  const onChangeThemeConsole = useCallback((checked: boolean) => {
    setEnv("DEBUG_THEME", checked);
  }, []);

  return (
    <Switch
      selected={env}
      onChange={onChangeThemeConsole}
      data-testid="settings-enable-theme-console"
    />
  );
};

export default EnableThemeConsole;
