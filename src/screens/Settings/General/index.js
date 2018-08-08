/* @flow */
import React, { PureComponent } from "react";
import { connect } from "react-redux";
import { compose } from "redux";
import { ScrollView } from "react-native";
import { translate } from "react-i18next";
import { createStructuredSelector } from "reselect";
import type { NavigationScreenProp } from "react-navigation";
import SettingsRow from "../../../components/SettingsRow";
import type { T } from "../../../types/common";
import CountervalueSettingsRow from "./CountervalueSettingsRow";
import RateProviderSettingsRow from "./RateProviderSettingsRow";
import AuthSecurityToggle from "./AuthSecurityToggle";

const mapStateToProps = createStructuredSelector({});

class GeneralSettings extends PureComponent<{
  navigation: NavigationScreenProp<*>,
  t: T,
}> {
  static navigationOptions = {
    title: "General",
  };

  render() {
    const { navigation, t } = this.props;
    return (
      <ScrollView contentContainerStyle={{ paddingVertical: 10 }}>
        <CountervalueSettingsRow navigation={navigation} />
        <RateProviderSettingsRow navigation={navigation} />
        <SettingsRow
          title={t("common:settings.display.password")}
          desc={t("common:settings.display.passwordDesc")}
        >
          <AuthSecurityToggle />
        </SettingsRow>
      </ScrollView>
    );
  }
}

export default compose(
  connect(mapStateToProps),
  translate(),
)(GeneralSettings);
