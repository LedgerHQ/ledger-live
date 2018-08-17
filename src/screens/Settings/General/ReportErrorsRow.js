/* @flow */
import React, { PureComponent } from "react";
import { translate } from "react-i18next";
import { connect } from "react-redux";
import { compose } from "redux";
import { Switch } from "react-native";
import { createStructuredSelector } from "reselect";
import SettingsRow from "../../../components/SettingsRow";
import type { T } from "../../../types/common";
import { setReportErrors } from "../../../actions/settings";
import { reportErrorsEnabledSelector } from "../../../reducers/settings";

type Props = {
  t: T,
  reportErrorsEnabled: boolean,
  setReportErrors: boolean => void,
};
const mapStateToProps = createStructuredSelector({
  reportErrorsEnabled: reportErrorsEnabledSelector,
});

const mapDispatchToProps = {
  setReportErrors,
};

class ReportErrorsRow extends PureComponent<Props> {
  render() {
    const { t, reportErrorsEnabled, setReportErrors } = this.props;
    return (
      <SettingsRow
        title={t("common:settings.display.reportErrors")}
        desc={t("common:settings.display.reportErrorsDesc")}
        onPress={null}
      >
        <Switch value={reportErrorsEnabled} onValueChange={setReportErrors} />
      </SettingsRow>
    );
  }
}

export default compose(
  connect(
    mapStateToProps,
    mapDispatchToProps,
  ),
  translate(),
)(ReportErrorsRow);
