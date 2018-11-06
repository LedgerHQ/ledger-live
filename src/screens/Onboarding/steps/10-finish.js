// @flow

import React, { Component } from "react";
import { connect } from "react-redux";

import { completeOnboarding } from "../../../actions/settings";
import LText from "../../../components/LText";
import Button from "../../../components/Button";
import OnboardingLayout from "../OnboardingLayout";
import { withOnboardingContext } from "../onboardingContext";

import type { OnboardingStepProps } from "../types";

type Props = OnboardingStepProps & {
  completeOnboarding: () => void,
};

const mapDispatchToProps = {
  completeOnboarding,
};

class OnboardingStep10Finish extends Component<Props> {
  onFinish = () => {
    this.props.completeOnboarding();
    this.props.navigation.navigate("Main");
  };

  render() {
    return (
      <OnboardingLayout isCentered>
        <LText>OnboardingStep10Finish</LText>
        <Button type="primary" title="Finish" onPress={this.onFinish} />
      </OnboardingLayout>
    );
  }
}

export default withOnboardingContext(
  connect(
    null,
    mapDispatchToProps,
  )(OnboardingStep10Finish),
);
