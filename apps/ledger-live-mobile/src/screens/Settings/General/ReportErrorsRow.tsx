import React from "react";
import { useTranslation } from "react-i18next";
import { useSelector, useDispatch } from "~/context/hooks";
import { Switch } from "@ledgerhq/native-ui";
import SettingsRow from "~/components/SettingsRow";
import { setReportErrors } from "~/actions/settings";
import { reportErrorsEnabledSelector } from "~/reducers/settings";
import { Track } from "~/analytics";

const ReportErrorsRow = () => {
  const { t } = useTranslation();

  const reportErrorsEnabled: boolean = useSelector(reportErrorsEnabledSelector);
  const dispatch = useDispatch();

  return (
    <>
      <Track event={reportErrorsEnabled ? "EnableReportBug" : "DisableReportBug"} onUpdate />
      <SettingsRow
        event="ReportErrorsRow"
        title={t("settings.display.reportErrors")}
        desc={t("settings.display.reportErrorsDesc")}
      >
        <Switch
          checked={reportErrorsEnabled}
          onChange={value => dispatch(setReportErrors(value))}
        />
      </SettingsRow>
    </>
  );
};

export default ReportErrorsRow;
