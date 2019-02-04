import React from "react";
import { compose } from "redux";
import connect from "react-redux/es/connect/connect";
import Config from "react-native-config";
import { createStructuredSelector } from "reselect";
import { hasCompletedOnboardingSelector } from "../reducers/settings";

class OnboardingOrNavigator extends React.Component<*> {
  constructor(props) {
    super(props);
    const { hasCompletedOnboarding, navigation } = this.props;
    const goToOnboarding = !hasCompletedOnboarding && !Config.SKIP_ONBOARDING;
    navigation.navigate(goToOnboarding ? "BaseOnboarding" : "BaseNavigator");
  }

  render() {
    return null;
  }
}

export default compose(
  connect(
    createStructuredSelector({
      hasCompletedOnboarding: hasCompletedOnboardingSelector,
    }),
  ),
)(OnboardingOrNavigator);
