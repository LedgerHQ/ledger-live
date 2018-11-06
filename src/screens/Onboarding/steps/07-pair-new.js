// @flow

import React, { Component } from "react";

import LText from "../../../components/LText";
import Button from "../../../components/Button";
import OnboardingLayout from "../OnboardingLayout";
import { withOnboardingContext } from "../onboardingContext";

import type { OnboardingStepProps } from "../types";

class OnboardingStep07PairNew extends Component<OnboardingStepProps> {
  Footer = () => {
    const { next } = this.props;
    return <Button type="primary" title="Next" onPress={next} />;
  };

  render() {
    return (
      <OnboardingLayout header="OnboardingStep07PairNew" Footer={this.Footer}>
        <LText>OnboardingStep07PairNew</LText>
        <LText>OnboardingStep07PairNew</LText>
      </OnboardingLayout>
    );
  }
}

export default withOnboardingContext(OnboardingStep07PairNew);
