/* @flow */
import React, { PureComponent } from "react";
import { ScrollView, StyleSheet } from "react-native";
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
      <ScrollView contentContainerStyle={styles.root}>
        <CountervalueSettingsRow navigation={navigation} />
        <RateProviderSettingsRow navigation={navigation} />
        <AuthSecurityToggle />
        {null && <ReportErrorsRow /> // FIXME enable when implemented
        }
        {null && <AnalyticsRow /> // FIXME enable when implemented
        }
      </ScrollView>
    );
  }
}

const styles = StyleSheet.create({
  root: { paddingTop: 16, paddingBottom: 64 },
});

export default GeneralSettings;
