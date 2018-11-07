// @flow

import React, { Component } from "react";

import LText from "../../../components/LText";
import Button from "../../../components/Button";
import OnboardingLayout from "../OnboardingLayout";
import { withOnboardingContext } from "../onboardingContext";

import type { OnboardingStepProps } from "../types";

class OnboardingStep09ShareData extends Component<OnboardingStepProps> {
  Footer = () => {
    const { next } = this.props;
    return <Button type="primary" title="Next" onPress={next} />;
  };

  render() {
    return (
      <OnboardingLayout header="OnboardingStep09ShareData" Footer={this.Footer}>
        <LText>OnboardingStep09ShareData</LText>
        <LText>OnboardingStep09ShareData</LText>
      </OnboardingLayout>
    );
  }
}

export default withOnboardingContext(OnboardingStep09ShareData);
