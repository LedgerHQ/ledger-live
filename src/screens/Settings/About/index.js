/* @flow */
import React, { PureComponent } from "react";
import { View, StyleSheet } from "react-native";
// $FlowFixMe
import { ScrollView } from "react-navigation";
import i18next from "i18next";
import { translate } from "react-i18next";
import { TrackScreen } from "../../../analytics";
import AppVersionRow from "./AppVersionRow";
import LiveReviewRow from "./LiveReviewRow";
import PrivacyPolicyRow from "./PrivacyPolicyRow";
import TermsConditionsRow from "./TermsConditionsRow";
import DescriptionRow from "./DescriptionRow";

class About extends PureComponent<*, *> {
  static navigationOptions = {
    title: i18next.t("settings.about.title"),
  };

  render() {
    return (
      <ScrollView contentContainerStyle={styles.root}>
        <TrackScreen category="Settings" name="About" />
        <DescriptionRow />
        <AppVersionRow />
        <TermsConditionsRow />
        <PrivacyPolicyRow />
        <View style={styles.container}>
          <LiveReviewRow />
        </View>
      </ScrollView>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    paddingTop: 16,
    paddingBottom: 64,
  },
  container: {
    marginTop: 16,
  },
});

export default translate()(About);
