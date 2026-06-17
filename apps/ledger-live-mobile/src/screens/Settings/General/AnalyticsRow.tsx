import React, { useCallback } from "react";
import { useSelector, useDispatch } from "~/context/hooks";
import { useTranslation } from "~/context/Locale";
import { Switch } from "@ledgerhq/native-ui";
import SettingsRow from "~/components/SettingsRow";
import { setAnalytics } from "~/actions/settings";
import { analyticsEnabledSelector } from "~/reducers/settings";
import { track, updateIdentify } from "~/analytics";

const AnalyticsRow = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const analyticsEnabled = useSelector(analyticsEnabledSelector);

  const toggleAnalytics = useCallback(
    (value: boolean) => {
      dispatch(setAnalytics(value));
      updateIdentify(undefined, true);
      track(
        "toggle_clicked",
        {
          enabled: value,
          toggle: "Analytics",
          page: "Page Settings General",
        },
        true,
      );
    },
    [dispatch],
  );

  return (
    <SettingsRow
      event="AnalyticsRow"
      title={t("settings.display.analytics")}
      desc={t("settings.display.analyticsDesc")}
    >
      <Switch checked={analyticsEnabled} onChange={toggleAnalytics} />
    </SettingsRow>
  );
};

export default AnalyticsRow;
