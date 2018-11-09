// @flow

import React, { Component } from "react";

import LText from "../../../components/LText";
import Button from "../../../components/Button";
import OnboardingLayout from "../OnboardingLayout";
import { withOnboardingContext } from "../onboardingContext";

import type { OnboardingStepProps } from "../types";

class OnboardingStepScanQR extends Component<OnboardingStepProps> {
  Footer = () => (
    <Button type="primary" title="Next" onPress={this.navigateToQR} />
  );

  navigateToQR = () => this.props.navigation.navigate("ImportAccounts");

  render() {
    return (
      <OnboardingLayout header="OnboardingStepScanQR" Footer={this.Footer}>
        <LText>scan qr</LText>
        <LText>scan qr</LText>
      </OnboardingLayout>
    );
  }
}

export default withOnboardingContext(OnboardingStepScanQR);
