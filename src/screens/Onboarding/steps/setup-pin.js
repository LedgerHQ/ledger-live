// @flow

import React, { Component } from "react";
import { Trans } from "react-i18next";
import { View, StyleSheet } from "react-native";

import { TrackScreen } from "../../../analytics";
import Button from "../../../components/Button";
import LText from "../../../components/LText";
import DeviceIconBack from "../../../icons/DeviceIconBack";
import DeviceNanoAction from "../../../components/DeviceNanoAction";
import DeviceIconCheck from "../../../icons/DeviceIconCheck";
import BulletList, { BulletItemText } from "../../../components/BulletList";
import OnboardingLayout from "../OnboardingLayout";
import { withOnboardingContext } from "../onboardingContext";
import colors from "../../../colors";
import { deviceNames } from "../../../wording";

import type { OnboardingStepProps } from "../types";
import PinModal from "../../../modals/Pin";

class OnboardingStepSetupPin extends Component<
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
      event="OnboardingPinContinue"
      type="primary"
      title={<Trans i18nKey="common.continue" />}
      onPress={this.showModal}
    />
  );

  render() {
    const { mode, next, deviceModelId } = this.props;
    const { isModalOpened } = this.state;

    const isNanoS = deviceModelId === "nanoS";
    return (
      <OnboardingLayout
        header="OnboardingStepSetupPin"
        Footer={this.Footer}
        noHorizontalPadding
        withNeedHelp
      >
        <TrackScreen category="Onboarding" name="Pin" />
        <PinModal
          isOpened={isModalOpened}
          onAccept={next}
          onClose={this.hideModal}
        />
        <View style={styles.hero}>
          <DeviceNanoAction
            modelId={deviceModelId}
            wired={isNanoS} // tradeoff in this onboarding that we don't save the info that NanoX might be on USB^^
            screen="pin"
          />
        </View>
        <View style={styles.wrapper}>
          <BulletList
            animated
            list={[
              <Trans
                i18nKey={`onboarding.stepSetupPin.step1${
                  isNanoS ? "-nanoS" : ""
                }`}
                values={isNanoS ? deviceNames.nanoS : deviceNames.nanoX}
              />,
              <Trans
                i18nKey={
                  mode === "restore"
                    ? "onboarding.stepSetupPin.step2-restore"
                    : "onboarding.stepSetupPin.step2"
                }
              >
                {"text"}
                <LText style={{ color: colors.darkBlue }} semiBold>
                  bold text
                </LText>
                {"text"}
              </Trans>,
              <Trans i18nKey="onboarding.stepSetupPin.step3" />,
              () => (
                <View
                  style={{
                    flexWrap: "wrap",
                    alignItems: "center",
                    flexDirection: "row",
                  }}
                >
                  <BulletItemText>
                    <Trans i18nKey="onboarding.stepSetupPin.step4prefix" />
                  </BulletItemText>
                  <DeviceIconCheck />
                  <BulletItemText>
                    <Trans i18nKey="onboarding.stepSetupPin.step4suffix1" />
                  </BulletItemText>
                  <View style={{ width: "100%" }} />
                  <BulletItemText>
                    <Trans i18nKey="onboarding.stepSetupPin.step4prefix" />
                  </BulletItemText>
                  <DeviceIconBack />
                  <BulletItemText>
                    <Trans i18nKey="onboarding.stepSetupPin.step4suffix2" />
                  </BulletItemText>
                </View>
              ),
            ]}
          />
        </View>
      </OnboardingLayout>
    );
  }
}

const styles = StyleSheet.create({
  hero: {
    paddingTop: 15,
    paddingBottom: 60,
    backgroundColor: colors.lightGrey,
    alignItems: "center",
  },
  wrapper: {
    padding: 16,
  },
});

export default withOnboardingContext(OnboardingStepSetupPin);
