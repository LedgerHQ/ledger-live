// @flow

import React, { Component } from "react";

import LText from "../../../components/LText";
import Button from "../../../components/Button";
import OnboardingLayout from "../OnboardingLayout";
import { withOnboardingContext } from "../onboardingContext";

import type { OnboardingStepProps } from "../types";

class OnboardingStep03ChooseDevice extends Component<OnboardingStepProps> {
  Footer = () => {
    const { next } = this.props;
    return <Button type="primary" title="Next" onPress={next} />;
  };

  render() {
    return (
      <OnboardingLayout
        header="OnboardingStep03ChooseDevice"
        Footer={this.Footer}
      >
        <LText>OnboardingStep03ChooseDevice</LText>
        <LText>OnboardingStep03ChooseDevice</LText>
      </OnboardingLayout>
    );
  }
}

export default withOnboardingContext(OnboardingStep03ChooseDevice);
