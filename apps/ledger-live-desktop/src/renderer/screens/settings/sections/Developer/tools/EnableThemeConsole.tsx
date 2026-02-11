import useEnv from "@ledgerhq/live-common/hooks/useEnv";
import { setEnv } from "@ledgerhq/live-env";
import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Switch } from "@ledgerhq/lumen-ui-react";
import DeveloperClassicRow from "../components/DeveloperClassicRow";

const EnableThemeConsole = () => {
  const { t } = useTranslation();
  const env = useEnv("DEBUG_THEME");

  const onChangeThemeConsole = useCallback((checked: boolean) => {
    setEnv("DEBUG_THEME", checked);
  }, []);

  return (
    <DeveloperClassicRow
      title={t("settings.developer.themeConsole.title")}
      desc={t("settings.developer.themeConsole.desc")}
    >
      <Switch
        selected={env}
        onChange={onChangeThemeConsole}
        data-testid="settings-enable-theme-console"
      />
    </DeveloperClassicRow>
  );
};

export default EnableThemeConsole;
