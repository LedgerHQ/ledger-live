import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useSelector, useDispatch } from "LLD/hooks/redux";
import { enablePlatformDevToolsSelector } from "~/renderer/reducers/settings";
import { setEnablePlatformDevTools } from "~/renderer/actions/settings";
import Track from "~/renderer/analytics/Track";
import { Switch } from "@ledgerhq/lumen-ui-react";
import DeveloperClassicRow from "../components/DeveloperClassicRow";

const EnablePlatformDevToolsToggle = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const enablePlatformDevTools = useSelector(enablePlatformDevToolsSelector);
  const onSetEnablePlatformDevTools = useCallback(
    (checked: boolean) => dispatch(setEnablePlatformDevTools(checked)),
    [dispatch],
  );
  return (
    <DeveloperClassicRow
      title={t("settings.developer.enablePlatformDevTools")}
      desc={t("settings.developer.enablePlatformDevToolsDesc")}
    >
      <Track onUpdate event="AllowExperimentalApps" />
      <Switch
        selected={enablePlatformDevTools}
        onChange={onSetEnablePlatformDevTools}
        data-testid="settings-enable-platform-dev-tools-apps"
      />
    </DeveloperClassicRow>
  );
};
export default EnablePlatformDevToolsToggle;
