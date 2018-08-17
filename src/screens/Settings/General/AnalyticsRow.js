/* @flow */
import React, { PureComponent } from "react";
import { translate } from "react-i18next";
import { connect } from "react-redux";
import { compose } from "redux";
import { Switch } from "react-native";
import { createStructuredSelector } from "reselect";
import SettingsRow from "../../../components/SettingsRow";
import type { T } from "../../../types/common";
import { setAnalytics } from "../../../actions/settings";
import { analyticsEnabledSelector } from "../../../reducers/settings";

type Props = {
  t: T,
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
    const { t, analyticsEnabled, setAnalytics } = this.props;
    return (
      <SettingsRow
        title={t("common:settings.display.analytics")}
        desc={t("common:settings.display.analyticsDesc")}
        onPress={null}
      >
        <Switch value={analyticsEnabled} onValueChange={setAnalytics} />
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
)(AnalyticsRow);
