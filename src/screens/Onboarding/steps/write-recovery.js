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

// TODO missing feature Seed Warning Box

class OnboardingStepWriteRecovery extends Component<OnboardingStepProps> {
  Footer = () => {
    const { next } = this.props;
    return (
      <Button
        type="primary"
        title={<Trans i18nKey="common.continue" />}
        onPress={next}
      />
    );
  };

  render() {
    const { mode } = this.props;
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
            list={
              mode === "restore"
                ? [
                    <Trans i18nKey="onboarding.stepWriteRecoveryRestore.step1" />,
                    <Trans i18nKey="onboarding.stepWriteRecoveryRestore.step2">
                      {"text"}
                      <LText semiBold style={{ color: colors.darkBlue }}>
                        bold text
                      </LText>
                      {"text"}
                    </Trans>,
                    <Trans i18nKey="onboarding.stepWriteRecoveryRestore.step3">
                      {"text"}
                      <LText semiBold style={{ color: colors.darkBlue }}>
                        bold text
                      </LText>
                      {"text"}
                    </Trans>,
                    <Trans i18nKey="onboarding.stepWriteRecoveryRestore.step4" />,
                  ]
                : [
                    <Trans i18nKey="onboarding.stepWriteRecovery.step1">
                      {"text"}
                      <LText semiBold style={{ color: colors.darkBlue }}>
                        bold text
                      </LText>
                      {"text"}
                    </Trans>,
                    <Trans i18nKey="onboarding.stepWriteRecovery.step2" />,
                    <Trans i18nKey="onboarding.stepWriteRecovery.step3" />,
                  ]
            }
          />
        </View>
      </OnboardingLayout>
    );
  }
}

const styles = StyleSheet.create({
  hero: {
    paddingVertical: 40,
    backgroundColor: colors.lightGrey,
    alignItems: "center",
  },
  wrapper: {
    padding: 16,
  },
});

export default withOnboardingContext(OnboardingStepWriteRecovery);
