/* @flow */
import React, { PureComponent } from "react";
import { Trans } from "react-i18next";
import SettingsRow from "../../../components/SettingsRow";
import { withOnboardingContext } from "../../Onboarding/onboardingContext";
import type { OnboardingStepProps } from "../../Onboarding/types";

class ConfigureDeviceRow extends PureComponent<OnboardingStepProps> {
  onPress = () => {
    // TODO: this is not optimal, because doing a "native" back after being
    // redirected to "get started" navigate to "welcome". it's due to how
    // navigator works.. don't know how we can manage this properly for now
    this.props.navigation.navigate("OnboardingStep02GetStarted");
  };

  render() {
    return (
      <SettingsRow
        title={<Trans i18nKey="settings.help.configureDevice" />}
        desc={<Trans i18nKey="settings.help.configureDeviceDesc" />}
        arrowRight
        onPress={this.onPress}
      />
    );
  }
}

export default withOnboardingContext(ConfigureDeviceRow);
