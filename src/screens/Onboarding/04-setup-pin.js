// @flow

import React, { Component } from "react";
import { translate } from "react-i18next";
import type { NavigationScreenProp } from "react-navigation";

import LText from "../../components/LText";
import Button from "../../components/Button";
import OnboardingLayout from "./OnboardingLayout";
import OnboardingHeader from "./OnboardingHeader";

type Props = {
  navigation: NavigationScreenProp<*>,
  t: *,
};

class OnboardingStep04SetupPin extends Component<Props> {
  static navigationOptions = {
    header: null,
  };

  onNext = () => {
    this.props.navigation.navigate("OnboardingStep05WriteRecovery");
  };

  onBack = () => {
    this.props.navigation.navigate("OnboardingStep03ChooseDevice");
  };

  render() {
    const { t } = this.props;
    return (
      <OnboardingLayout>
        <OnboardingHeader
          title={t("onboarding.step04SetupPin.title")}
          step={2}
          nbSteps={7}
          onBack={this.onBack}
        />
        <LText>OnboardingStep04SetupPin</LText>
        <Button type="primary" title="Next" onPress={this.onNext} />
      </OnboardingLayout>
    );
  }
}

export default translate()(OnboardingStep04SetupPin);
