import useEnv from "@features/platform-env";
import { setEnv } from "@shared/env";
import React, { useCallback } from "react";
import { Switch } from "@ledgerhq/lumen-ui-react";
const EnableAnalyticsConsole = () => {
  const env = useEnv("ANALYTICS_CONSOLE");

  const onChangeAnalyticsConsole = useCallback((checked: boolean) => {
    setEnv("ANALYTICS_CONSOLE", checked);
  }, []);

  return (
    <Switch
      selected={env}
      onChange={onChangeAnalyticsConsole}
      data-testid="settings-enable-earn-page-staging-url"
    />
  );
};
export default EnableAnalyticsConsole;
