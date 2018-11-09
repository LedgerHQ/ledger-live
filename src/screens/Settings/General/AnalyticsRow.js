/* @flow */
import React, { PureComponent } from "react";
import { connect } from "react-redux";
import { Switch } from "react-native";
import { Trans } from "react-i18next";
import { createStructuredSelector } from "reselect";
import SettingsRow from "../../../components/SettingsRow";
import { setAnalytics } from "../../../actions/settings";
import { analyticsEnabledSelector } from "../../../reducers/settings";

type Props = {
  analyticsEnabled: boolean,
  setAnalytics: boolean => void,
};

const mapStateToProps = createStructuredSelector({
  analyticsEnabled: analyticsEnabledSelector,
});

const mapDispatchToProps = {
  setAnalytics,
};

class AnalyticsRow extends PureComponent<Props> {
  render() {
    const { analyticsEnabled, setAnalytics } = this.props;
    return (
      <SettingsRow
        title={<Trans i18nKey="settings.display.analytics" />}
        desc={<Trans i18nKey="settings.display.analyticsDesc" />}
        onPress={null}
      >
        <Switch value={analyticsEnabled} onValueChange={setAnalytics} />
      </SettingsRow>
    );
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(AnalyticsRow);
