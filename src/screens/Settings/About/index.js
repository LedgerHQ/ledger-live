/* @flow */
import React, { PureComponent } from "react";
import { ScrollView } from "react-native";
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
      <ScrollView contentContainerStyle={{ paddingVertical: 10 }}>
        <DescriptionRow />
        <AppVersionRow />
        <TermsConditionsRow />
        <PrivacyPolicyRow />
        <LiveReviewRow />
      </ScrollView>
    );
  }
}

export default About;
