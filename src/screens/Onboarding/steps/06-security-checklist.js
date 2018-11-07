// @flow

import React, { Component } from "react";

import LText from "../../../components/LText";
import Button from "../../../components/Button";
import OnboardingLayout from "../OnboardingLayout";
import { withOnboardingContext } from "../onboardingContext";

import type { OnboardingStepProps } from "../types";

class OnboardingStep06SecurityChecklist extends Component<OnboardingStepProps> {
  Footer = () => {
    const { next } = this.props;
    return <Button type="primary" title="Next" onPress={next} />;
  };

  render() {
    return (
      <OnboardingLayout
        header="OnboardingStep06SecurityChecklist"
        Footer={this.Footer}
      >
        <LText>OnboardingStep06SecurityChecklist</LText>
        <LText>OnboardingStep06SecurityChecklist</LText>
      </OnboardingLayout>
    );
  }
}

export default withOnboardingContext(OnboardingStep06SecurityChecklist);
