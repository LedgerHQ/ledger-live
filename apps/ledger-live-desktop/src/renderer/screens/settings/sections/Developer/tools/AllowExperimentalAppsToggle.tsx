import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useSelector, useDispatch } from "LLD/hooks/redux";
import { allowExperimentalAppsSelector } from "~/renderer/reducers/settings";
import { setAllowExperimentalApps } from "~/renderer/actions/settings";
import Track from "~/renderer/analytics/Track";
import { Switch } from "@ledgerhq/lumen-ui-react";
import DeveloperClassicRow from "../components/DeveloperClassicRow";

const AllowExperimentalAppsToggle = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const allowExperimentalApps = useSelector(allowExperimentalAppsSelector);
  const onSetAllowExperimentalApps = useCallback(
    (checked: boolean) => dispatch(setAllowExperimentalApps(checked)),
    [dispatch],
  );
  return (
    <DeveloperClassicRow
      title={t("settings.developer.experimentalApps")}
      desc={t("settings.developer.experimentalAppsDesc")}
    >
      <Track onUpdate event="AllowExperimentalApps" />
      <Switch
        selected={allowExperimentalApps}
        onChange={onSetAllowExperimentalApps}
        data-testid="settings-allow-experimental-apps"
      />
    </DeveloperClassicRow>
  );
};
export default AllowExperimentalAppsToggle;
