// @flow

import React, { Component } from "react";
import { Trans } from "react-i18next";
import { View, StyleSheet, Image } from "react-native";

import LText from "../../../components/LText";
import Button from "../../../components/Button";
import colors from "../../../colors";
import OnboardingLayout from "../OnboardingLayout";
import { withOnboardingContext } from "../onboardingContext";

import type { OnboardingStepProps } from "../types";

const illustration = (
  <Image source={require("../assets/password-illustration.png")} />
);

class OnboardingStep08Password extends Component<OnboardingStepProps> {
  Footer = () => {
    const { next } = this.props;
    return (
      <Button
        type="primary"
        title={<Trans i18nKey="onboarding.step08Password.setPassword" />}
        onPress={next}
      />
    );
  };

  render() {
    return (
      <OnboardingLayout
        header="OnboardingStep08Password"
        Footer={this.Footer}
        withSkip
      >
        <View style={styles.hero}>{illustration}</View>
        <LText style={styles.desc} semiBold>
          <Trans i18nKey="onboarding.step08Password.desc" />
        </LText>
      </OnboardingLayout>
    );
  }
}

const styles = StyleSheet.create({
  hero: {
    paddingTop: 16,
    paddingBottom: 24,
    alignItems: "center",
  },
  desc: {
    textAlign: "center",
    color: colors.darkBlue,
    fontSize: 16,
  },
});

export default withOnboardingContext(OnboardingStep08Password);
