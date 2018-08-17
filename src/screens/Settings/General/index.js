/* @flow */
import React, { PureComponent } from "react";
import { ScrollView } from "react-native";
import type { NavigationScreenProp } from "react-navigation";
import CountervalueSettingsRow from "./CountervalueSettingsRow";
import RateProviderSettingsRow from "./RateProviderSettingsRow";
import AuthSecurityToggle from "./AuthSecurityToggle";
import ReportErrorsRow from "./ReportErrorsRow";
import AnalyticsRow from "./AnalyticsRow";

class GeneralSettings extends PureComponent<{
  navigation: NavigationScreenProp<*>,
}> {
  static navigationOptions = {
    title: "General",
  };

  render() {
    const { navigation } = this.props;
    return (
      <ScrollView contentContainerStyle={{ paddingVertical: 10 }}>
        <CountervalueSettingsRow navigation={navigation} />
        <RateProviderSettingsRow navigation={navigation} />
        <AuthSecurityToggle />
        <ReportErrorsRow />
        <AnalyticsRow />
      </ScrollView>
    );
  }
}

export default GeneralSettings;
