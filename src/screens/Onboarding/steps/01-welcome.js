// @flow

import React, { Component } from "react";

import LText from "../../../components/LText";
import Button from "../../../components/Button";
import OnboardingLayout from "../OnboardingLayout";
import { withOnboardingContext } from "../onboardingContext";

import type { OnboardingStepProps } from "../types";

class OnboardingStep01Welcome extends Component<OnboardingStepProps> {
  render() {
    return (
      <OnboardingLayout isCentered>
        <LText>OnboardingStep01Welcome</LText>
        <LText>{this.props.currentStep}</LText>
        <Button type="primary" title="Next" onPress={this.props.next} />
      </OnboardingLayout>
    );
  }
}

export default withOnboardingContext(OnboardingStep01Welcome);
