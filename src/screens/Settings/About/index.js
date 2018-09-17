/* @flow */
import React, { PureComponent } from "react";
import { ScrollView, View } from "react-native";
import AppVersionRow from "./AppVersionRow";
import LiveReviewRow from "./LiveReviewRow";
import PrivacyPolicyRow from "./PrivacyPolicyRow";
import TermsConditionsRow from "./TermsConditionsRow";
import DescriptionRow from "./DescriptionRow";

class About extends PureComponent<*, *> {
  static navigationOptions = {
    title: "About",
  };

  render() {
    return (
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        <DescriptionRow />
        <AppVersionRow />
        <TermsConditionsRow />
        <PrivacyPolicyRow />
        <View style={{ marginTop: 16 }}>
          <LiveReviewRow />
        </View>
      </ScrollView>
    );
  }
}

export default About;
