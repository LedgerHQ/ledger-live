/* @flow */
import React, { PureComponent } from "react";
import { Trans } from "react-i18next";
import { connect } from "react-redux";
import { Switch } from "react-native";
import { createStructuredSelector } from "reselect";
import SettingsRow from "../../../components/SettingsRow";
import { setReportErrors } from "../../../actions/settings";
import { reportErrorsEnabledSelector } from "../../../reducers/settings";

type Props = {
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
    const { reportErrorsEnabled, setReportErrors, ...props } = this.props;
    return (
      <SettingsRow
        event="ReportErrorsRow"
        title={<Trans i18nKey="settings.display.reportErrors" />}
        desc={<Trans i18nKey="settings.display.reportErrorsDesc" />}
        onPress={null}
        alignedTop
        {...props}
      >
        <Switch
          style={{ opacity: 0.99 }}
          value={reportErrorsEnabled}
          onValueChange={setReportErrors}
        />
      </SettingsRow>
    );
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(ReportErrorsRow);
