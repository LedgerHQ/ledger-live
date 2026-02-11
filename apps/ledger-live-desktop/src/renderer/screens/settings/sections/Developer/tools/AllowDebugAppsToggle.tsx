import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useSelector, useDispatch } from "LLD/hooks/redux";
import { allowDebugAppsSelector } from "~/renderer/reducers/settings";
import { setAllowDebugApps } from "~/renderer/actions/settings";
import Track from "~/renderer/analytics/Track";
import { Switch } from "@ledgerhq/lumen-ui-react";
import DeveloperClassicRow from "../components/DeveloperClassicRow";

const AllowDebugAppsToggle = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const allowDebugApps = useSelector(allowDebugAppsSelector);
  const onSetAllowDebugApps = useCallback(
    (checked: boolean) => dispatch(setAllowDebugApps(checked)),
    [dispatch],
  );
  return (
    <DeveloperClassicRow
      title={t("settings.developer.debugApps")}
      desc={t("settings.developer.debugAppsDesc")}
    >
      <Track onUpdate event="AllowDebugApps" />
      <Switch
        selected={allowDebugApps}
        onChange={onSetAllowDebugApps}
        data-testid="settings-allow-debug-apps"
      />
    </DeveloperClassicRow>
  );
};
export default AllowDebugAppsToggle;
