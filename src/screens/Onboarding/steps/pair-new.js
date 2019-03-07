// @flow

import React, { Component } from "react";
import { Linking } from "react-native";

import { TrackScreen } from "../../../analytics";
import Button from "../../../components/Button";
import SelectDevice from "../../../components/SelectDevice";
import OnboardingLayout from "../OnboardingLayout";
import { withOnboardingContext } from "../onboardingContext";
import { urls } from "../../../config/urls";

import type { OnboardingStepProps } from "../types";

class OnboardingStepPairNew extends Component<OnboardingStepProps> {
  Footer = () =>
    __DEV__ ? (
      <Button
        event="OnboardingPairSkip"
        type="lightSecondary"
        title="(DEV) skip this step"
        onPress={this.props.next}
      />
    ) : null;

  help = () => Linking.openURL(urls.faq);

  pairNew = () => this.props.navigation.navigate("PairDevices");

  render() {
    return (
      <OnboardingLayout
        header="OnboardingStepPairNew"
        Footer={this.Footer}
        borderedFooter
        noTopPadding
        withNeedHelp
      >
        <TrackScreen category="Onboarding" name="PairNew" />
        <SelectDevice onboarding onSelect={this.props.next} />
      </OnboardingLayout>
    );
  }
}

export default withOnboardingContext(OnboardingStepPairNew);
