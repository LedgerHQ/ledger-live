/* @flow */
import React, { PureComponent } from "react";
import { ScrollView, View, StyleSheet } from "react-native";
import i18next from "i18next";
import { translate } from "react-i18next";
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
