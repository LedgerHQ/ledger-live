/* @flow */
import React from "react";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import SettingsRow from "../../../components/SettingsRow";
import { setReportErrors } from "../../../actions/settings";
import { reportErrorsEnabledSelector } from "../../../reducers/settings";
import Switch from "../../../components/Switch";

const ReportErrorsRow = () => {
  const { t } = useTranslation();

  const reportErrorsEnabled = useSelector(reportErrorsEnabledSelector);
  const dispatch = useDispatch();

  return (
    <SettingsRow
      event="ReportErrorsRow"
      title={t("settings.display.reportErrors")}
      desc={t("settings.display.reportErrorsDesc")}
      onPress={null}
      alignedTop
    >
      <Switch
        style={{ opacity: 0.99 }}
        value={reportErrorsEnabled}
        onValueChange={value => dispatch(setReportErrors(value))}
      />
    </SettingsRow>
  );
};

export default ReportErrorsRow;
