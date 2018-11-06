// @flow

import React, { Component } from "react";

import Button from "../../../components/Button";
import OnboardingLayout from "../OnboardingLayout";
import { withOnboardingContext } from "../onboardingContext";

import type { OnboardingStepProps } from "../types";

class OnboardingStep02GetStarted extends Component<OnboardingStepProps> {
  onRestore = async () => {
    await this.props.setOnboardingMode("alreadyInitialized");
    this.props.next();
  };

  onInit = async () => {
    await this.props.setOnboardingMode("full");
    this.props.next();
  };

  render() {
    return (
      <OnboardingLayout isFull>
        <Button type="secondary" title="Initialize new" onPress={this.onInit} />
        <Button
          type="secondary"
          title="Already initialized"
          onPress={this.onRestore}
        />
      </OnboardingLayout>
    );
  }
}

export default withOnboardingContext(OnboardingStep02GetStarted);
