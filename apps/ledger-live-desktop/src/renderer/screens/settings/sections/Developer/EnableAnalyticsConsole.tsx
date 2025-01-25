import useEnv from "@ledgerhq/live-common/hooks/useEnv";
import { setEnv } from "@ledgerhq/live-env";
import React, { useCallback } from "react";
import Switch from "~/renderer/components/Switch";
const EnableAnalyticsConsole = () => {
  const env = useEnv("ANALYTICS_CONSOLE");

  const onChangeAnalyticsConsole = useCallback((checked: boolean) => {
    setEnv("ANALYTICS_CONSOLE", checked);
  }, []);

  return (
    <Switch
      isChecked={env}
      onChange={onChangeAnalyticsConsole}
      data-testid="settings-enable-earn-page-staging-url"
    />
  );
};
export default EnableAnalyticsConsole;
