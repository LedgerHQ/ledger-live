// @flow

import React, { Component } from "react";
import { Trans } from "react-i18next";
import { View, StyleSheet } from "react-native";

import { TrackScreen } from "../../../analytics";
import Button from "../../../components/Button";
import RecoveryPhraseModal from "../../../modals/RecoveryPhrase";
import LText from "../../../components/LText";
import OnboardingLayout from "../OnboardingLayout";
import { withOnboardingContext } from "../onboardingContext";
import colors from "../../../colors";
import BulletList from "../../../components/BulletList";
import RecoveryPhrase from "../../../icons/RecoveryPhrase";

import type { OnboardingStepProps } from "../types";

class OnboardingStepWriteRecovery extends Component<
  OnboardingStepProps,
  { isModalOpened: boolean },
> {
  state = {
    isModalOpened: false,
  };
  showModal = () => {
    this.setState({ isModalOpened: true });
  };
  hideModal = () => {
    this.setState({ isModalOpened: false });
  };

  Footer = () => (
    <Button
      event="OnboardingRecoveryContinue"
      type="primary"
      title={<Trans i18nKey="common.continue" />}
      onPress={this.showModal}
    />
  );

  render() {
    const { mode, next } = this.props;
    const { isModalOpened } = this.state;

    return (
      <OnboardingLayout
        header="OnboardingStepWriteRecovery"
        Footer={this.Footer}
        noHorizontalPadding
        withNeedHelp
      >
        <TrackScreen category="Onboarding" name="Recovery" />
        <RecoveryPhraseModal
          isOpened={isModalOpened}
          onAccept={next}
          onClose={this.hideModal}
        />
        <View style={styles.hero}>
          <RecoveryPhrase />
        </View>
        <View style={styles.wrapper}>
          <BulletList
            animated
            list={
              mode === "restore"
                ? [
                    <Trans i18nKey="onboarding.stepWriteRecoveryRestore.step1" />,
                    <Trans i18nKey="onboarding.stepWriteRecoveryRestore.step2" />,
                    <Trans i18nKey="onboarding.stepWriteRecoveryRestore.step3">
                      {"text"}
                      <LText semiBold style={{ color: colors.darkBlue }}>
                        bold text
                      </LText>
                      {"text"}
                    </Trans>,
                    <Trans i18nKey="onboarding.stepWriteRecoveryRestore.step4">
                      {"text"}
                      <LText semiBold style={{ color: colors.darkBlue }}>
                        bold text
                      </LText>
                      {"text"}
                    </Trans>,
                    <Trans i18nKey="onboarding.stepWriteRecoveryRestore.step5" />,
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
