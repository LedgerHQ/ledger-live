// @flow

import React, { Component } from "react";
import { Trans } from "react-i18next";
import { View, StyleSheet } from "react-native";

import Button from "../../../components/Button";
import LText from "../../../components/LText";
import OnboardingLayout from "../OnboardingLayout";
import { withOnboardingContext } from "../onboardingContext";
import colors from "../../../colors";
import BulletList from "../../../components/BulletList";
import RecoveryPhrase from "../assets/RecoveryPhrase";

import type { OnboardingStepProps } from "../types";

class OnboardingStepWriteRecovery extends Component<OnboardingStepProps> {
  Footer = () => {
    const { next } = this.props;
    return <Button type="primary" title="Next" onPress={next} />;
  };

  render() {
    return (
      <OnboardingLayout
        header="OnboardingStepWriteRecovery"
        Footer={this.Footer}
        noHorizontalPadding
      >
        <View style={styles.hero}>
          <RecoveryPhrase />
        </View>
        <View style={styles.wrapper}>
          <BulletList
            list={[
              <Trans i18nKey="onboarding.stepWriteRecovery.step1">
                {"text"}
                <LText semiBold>bold text</LText>
                {"text"}
              </Trans>,
              <Trans i18nKey="onboarding.stepWriteRecovery.step2" />,
              <Trans i18nKey="onboarding.stepWriteRecovery.step3" />,
            ]}
          />
        </View>
      </OnboardingLayout>
    );
  }
}

const styles = StyleSheet.create({
  hero: {
    paddingVertical: 60,
    backgroundColor: colors.lightGrey,
    alignItems: "center",
  },
  wrapper: {
    padding: 16,
  },
});

export default withOnboardingContext(OnboardingStepWriteRecovery);
