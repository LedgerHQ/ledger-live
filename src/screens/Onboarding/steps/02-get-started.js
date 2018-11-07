// @flow

import React, { Component } from "react";
import { StyleSheet } from "react-native";
import { Trans } from "react-i18next";

import Button from "../../../components/Button";
import OnboardingLayout from "../OnboardingLayout";
import LText from "../../../components/LText";
import { withOnboardingContext } from "../onboardingContext";
import colors from "../../../colors";

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
        <LText style={styles.title} secondary semiBold>
          <Trans i18nKey="onboarding.step02GetStarted.title" />
        </LText>
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

const styles = StyleSheet.create({
  title: {
    fontSize: 24,
    color: colors.darkBlue,
    marginVertical: 32,
  },
});

export default withOnboardingContext(OnboardingStep02GetStarted);
