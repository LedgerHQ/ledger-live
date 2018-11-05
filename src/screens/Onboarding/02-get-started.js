// @flow

import React, { Component } from "react";
import { translate } from "react-i18next";
import type { NavigationScreenProp } from "react-navigation";

import LText from "../../components/LText";
import Button from "../../components/Button";
import OnboardingLayout from "./OnboardingLayout";

type Props = {
  navigation: NavigationScreenProp<*>,
  t: *,
};

class OnboardingStep02GetStarted extends Component<Props> {
  static navigationOptions = {
    header: null,
  };

  onNext = () => {
    this.props.navigation.navigate("OnboardingStep03ChooseDevice");
  };

  render() {
    return (
      <OnboardingLayout>
        <LText>OnboardingStep02GetStarted</LText>
        <Button type="primary" title="Next" onPress={this.onNext} />
      </OnboardingLayout>
    );
  }
}

export default translate()(OnboardingStep02GetStarted);
