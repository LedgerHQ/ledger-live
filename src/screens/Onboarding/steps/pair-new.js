// @flow

import React, { Component } from "react";
import { Linking } from "react-native";

import { TrackScreen } from "../../../analytics";
import { ScreenName } from "../../../const";
import Button from "../../../components/Button";
import SelectDevice from "../../../components/SelectDevice";
import OnboardingLayout from "../OnboardingLayout";
import { withOnboardingContext } from "../onboardingContext";
import { urls } from "../../../config/urls";

import {
  connectingStep,
  dashboard,
  listApps,
} from "../../../components/DeviceJob/steps";

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

  pairNew = () => this.props.navigation.navigate(ScreenName.PairDevices);

  render() {
    const { deviceModelId, t } = this.props;
    const usbOnly = ["nanoS", "blue"].includes(deviceModelId);

    return (
      <OnboardingLayout
        header="OnboardingStepPairNew"
        Footer={this.Footer}
        borderedFooter
        noTopPadding
        withNeedHelp
        titleOverride={
          usbOnly
            ? t(`onboarding.stepsTitles.OnboardingStepConnectNew`)
            : undefined
        }
      >
        <TrackScreen category="Onboarding" name="PairNew" />
        <SelectDevice
          withArrows
          usbOnly={usbOnly}
          deviceModelId={deviceModelId}
          onSelect={this.props.next}
          steps={usbOnly ? [connectingStep, dashboard, listApps] : []}
          autoSelectOnAdd
        />
      </OnboardingLayout>
    );
  }
}

export default withOnboardingContext(OnboardingStepPairNew);
