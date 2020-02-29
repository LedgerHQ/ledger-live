import React from "react";
import { compose } from "redux";
import { connect } from "react-redux";
import Config from "react-native-config";
import { createStructuredSelector } from "reselect";
import { withNavigation } from "react-navigation";
import { Buffer } from "buffer";
import { hasCompletedOnboardingSelector } from "../reducers/settings";

class OnboardingOrNavigator extends React.Component<*> {
  constructor(props) {
    super(props);
    if (__DEV__ && props.screenProps.importDataString) {
      const {
        navigation,
        screenProps: { importDataString },
      } = this.props;

      const data = JSON.parse(
        Buffer.from(importDataString, "base64").toString("utf8"),
      );
      navigation.navigate("ImportAccounts", { data });
    }
    const { hasCompletedOnboarding, navigation } = this.props;
    const goToOnboarding = !hasCompletedOnboarding && !Config.SKIP_ONBOARDING;
    navigation.navigate(goToOnboarding ? "BaseOnboarding" : "BaseNavigator");
  }

  render() {
    return null;
  }
}

export default compose(
  withNavigation,
  connect(
    createStructuredSelector({
      hasCompletedOnboarding: hasCompletedOnboardingSelector,
    }),
  ),
)(OnboardingOrNavigator);
