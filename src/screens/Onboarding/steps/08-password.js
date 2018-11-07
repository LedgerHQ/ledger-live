// @flow

import React, { Component } from "react";

import LText from "../../../components/LText";
import Button from "../../../components/Button";
import OnboardingLayout from "../OnboardingLayout";
import { withOnboardingContext } from "../onboardingContext";

import type { OnboardingStepProps } from "../types";

class OnboardingStep08Password extends Component<OnboardingStepProps> {
  Footer = () => {
    const { next } = this.props;
    return <Button type="primary" title="Next" onPress={next} />;
  };

  render() {
    return (
      <OnboardingLayout header="OnboardingStep08Password" Footer={this.Footer}>
        <LText>OnboardingStep08Password</LText>
        <LText>OnboardingStep08Password</LText>
      </OnboardingLayout>
    );
  }
}

export default withOnboardingContext(OnboardingStep08Password);
