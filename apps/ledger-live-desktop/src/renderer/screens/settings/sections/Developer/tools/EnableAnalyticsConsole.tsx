import useEnv from "@ledgerhq/live-common/hooks/useEnv";
import { setEnv } from "@ledgerhq/live-env";
import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Switch } from "@ledgerhq/lumen-ui-react";
import DeveloperClassicRow from "../components/DeveloperClassicRow";

const EnableAnalyticsConsole = () => {
  const { t } = useTranslation();
  const env = useEnv("ANALYTICS_CONSOLE");

  const onChangeAnalyticsConsole = useCallback((checked: boolean) => {
    setEnv("ANALYTICS_CONSOLE", checked);
  }, []);

  return (
    <DeveloperClassicRow
      title={t("settings.developer.analyticsConsole.title")}
      desc={t("settings.developer.analyticsConsole.desc")}
    >
      <Switch
        selected={env}
        onChange={onChangeAnalyticsConsole}
        data-testid="settings-enable-earn-page-staging-url"
      />
    </DeveloperClassicRow>
  );
};
export default EnableAnalyticsConsole;
