// @flow

import React, { Component } from "react";

import LText from "../../../components/LText";
import Button from "../../../components/Button";
import OnboardingLayout from "../OnboardingLayout";
import { withOnboardingContext } from "../onboardingContext";

import type { OnboardingStepProps } from "../types";

class OnboardingStep05WriteRecovery extends Component<OnboardingStepProps> {
  Footer = () => {
    const { next } = this.props;
    return <Button type="primary" title="Next" onPress={next} />;
  };

  render() {
    return (
      <OnboardingLayout
        header="OnboardingStep05WriteRecovery"
        Footer={this.Footer}
      >
        <LText>OnboardingStep05WriteRecovery</LText>
        <LText>OnboardingStep05WriteRecovery</LText>
      </OnboardingLayout>
    );
  }
}

export default withOnboardingContext(OnboardingStep05WriteRecovery);
