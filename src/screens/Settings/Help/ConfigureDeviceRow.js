/* @flow */
import React, { PureComponent } from "react";
import SettingsRow from "../../../components/SettingsRow";
import { withOnboardingContext } from "../../Onboarding/onboardingContext";
import type { OnboardingStepProps } from "../../Onboarding/types";

class ConfigureDeviceRow extends PureComponent<OnboardingStepProps> {
  onPress = async () => {
    this.props.setShowWelcome(false);
    this.props.navigation.navigate("OnboardingStepGetStarted");
  };

  render() {
    const { t } = this.props;
    return (
      <SettingsRow
        title={t("common:settings.display.configureDevice")}
        desc={t("common:settings.display.configureDeviceDesc")}
        arrowRight
        onPress={this.onPress}
      />
    );
  }
}

export default withOnboardingContext(ConfigureDeviceRow);
