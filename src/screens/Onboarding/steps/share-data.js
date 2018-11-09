// @flow

import React, { Component } from "react";

import LText from "../../../components/LText";
import Button from "../../../components/Button";
import OnboardingLayout from "../OnboardingLayout";
import { withOnboardingContext } from "../onboardingContext";

import type { OnboardingStepProps } from "../types";

class OnboardingStepShareData extends Component<OnboardingStepProps> {
  Footer = () => {
    const { next } = this.props;
    return <Button type="primary" title="Next" onPress={next} />;
  };

  render() {
    return (
      <OnboardingLayout header="OnboardingStepShareData" Footer={this.Footer}>
        <LText>OnboardingStepShareData</LText>
        <LText>OnboardingStepShareData</LText>
      </OnboardingLayout>
    );
  }
}

export default withOnboardingContext(OnboardingStepShareData);
