/* @flow */
import React, { PureComponent } from "react";
import { StyleSheet } from "react-native";
import type { NavigationScreenProp } from "react-navigation";
// $FlowFixMe
import { ScrollView } from "react-navigation";
import i18next from "i18next";
import { translate } from "react-i18next";
import { TrackScreen } from "../../../analytics";
import CountervalueSettingsRow from "./CountervalueSettingsRow";
import AuthSecurityToggle from "./AuthSecurityToggle";
import ReportErrorsRow from "./ReportErrorsRow";
import AnalyticsRow from "./AnalyticsRow";

class GeneralSettings extends PureComponent<{
  navigation: NavigationScreenProp<*>,
}> {
  static navigationOptions = {
    title: i18next.t("settings.display.title"),
  };

  render() {
    const { navigation } = this.props;
    return (
      <ScrollView contentContainerStyle={styles.root}>
        <TrackScreen category="Settings" name="General" />
        <CountervalueSettingsRow navigation={navigation} />
        <AuthSecurityToggle navigation={navigation} />
        <ReportErrorsRow />
        <AnalyticsRow />
      </ScrollView>
    );
  }
}

const styles = StyleSheet.create({
  root: { paddingTop: 16, paddingBottom: 64 },
});

export default translate()(GeneralSettings);
