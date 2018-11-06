// @flow

import React, { Component } from "react";

import LText from "../../../components/LText";
import Button from "../../../components/Button";
import OnboardingLayout from "../OnboardingLayout";
import { withOnboardingContext } from "../onboardingContext";

import type { OnboardingStepProps } from "../types";

class OnboardingStep04SetupPin extends Component<OnboardingStepProps> {
  Footer = () => {
    const { next } = this.props;
    return <Button type="primary" title="Next" onPress={next} />;
  };

  render() {
    return (
      <OnboardingLayout header="OnboardingStep04SetupPin" Footer={this.Footer}>
        <LText>OnboardingStep04SetupPin</LText>
        <LText>OnboardingStep04SetupPin</LText>
      </OnboardingLayout>
    );
  }
}

export default withOnboardingContext(OnboardingStep04SetupPin);
