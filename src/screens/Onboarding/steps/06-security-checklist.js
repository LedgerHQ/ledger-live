// @flow

import React, { Component } from "react";
import { Trans } from "react-i18next";
import { StyleSheet, View, Linking } from "react-native";

import LText from "../../../components/LText";
import BottomModal from "../../../components/BottomModal";
import Button from "../../../components/Button";
import Circle from "../../../components/Circle";
import OnboardingLayout from "../OnboardingLayout";
import OnboardingChoice from "../OnboardingChoice";
import { withOnboardingContext } from "../onboardingContext";
import { Bullet } from "../../../components/BulletList";
import colors, { rgba } from "../../../colors";
import { urls } from "../../../config/urls";
import IconWarning from "../../../icons/Warning";

import type { OnboardingStepProps } from "../types";

const subSteps = ["pinCode", "recoveryPhrase"];

type State = {
  subStepIndex: number,
};

class OnboardingStep06SecurityChecklist extends Component<
  OnboardingStepProps,
  State,
> {
  state = {
    subStepIndex: 0,
  };

  Footer = () => {
    const { security } = this.props;
    const { subStepIndex } = this.state;
    return (
      <Button
        type="primary"
        title="Next"
        onPress={this.next}
        disabled={security[subSteps[subStepIndex]] !== true}
      />
    );
  };

  next = () => {
    const { next } = this.props;
    const { subStepIndex } = this.state;
    if (subStepIndex === subSteps.length - 1) {
      next();
    } else {
      this.setState({ subStepIndex: subStepIndex + 1 });
    }
  };

  answerYep = () =>
    this.props.setSecurityKey(subSteps[this.state.subStepIndex], true);
  answerNope = () =>
    this.props.setSecurityKey(subSteps[this.state.subStepIndex], false);
  resetAnswer = () =>
    this.props.setSecurityKey(subSteps[this.state.subStepIndex], null);

  contactSupport = () => Linking.openURL(urls.faq);

  render() {
    const { security } = this.props;
    const { subStepIndex } = this.state;
    const subStep = subSteps[subStepIndex];
    const answer = security[subStep];
    return (
      <OnboardingLayout
        header="OnboardingStep06SecurityChecklist"
        Footer={this.Footer}
      >
        <Bullet big>{subStepIndex + 1}</Bullet>
        <LText style={styles.title} semiBold>
          <Trans
            i18nKey={`onboarding.step06SecurityChecklist.${subStep}.title`}
          />
        </LText>
        <OnboardingChoice isChecked={answer === true} onPress={this.answerYep}>
          <Trans i18nKey="common.yes" />
        </OnboardingChoice>
        <OnboardingChoice
          isChecked={answer === false}
          onPress={this.answerNope}
        >
          <Trans i18nKey="common.no" />
        </OnboardingChoice>
        <BottomModal isOpened={answer === false} onClose={this.resetAnswer}>
          <View style={styles.modalIconContainer}>
            <Circle bg={rgba(colors.alert, 0.1)} size={56}>
              <IconWarning size={24} color={colors.alert} />
            </Circle>
          </View>
          <LText style={styles.modalText}>
            <Trans
              i18nKey={`onboarding.step06SecurityChecklist.${subStep}.error`}
            />
          </LText>
          <View style={styles.modalActions}>
            <Button
              containerStyle={styles.modalAction}
              type="secondary"
              onPress={this.resetAnswer}
              title={<Trans i18nKey="common.back" />}
            />
            <Button
              containerStyle={styles.modalAction}
              type="primary"
              onPress={this.contactSupport}
              title={<Trans i18nKey="common.contactUs" />}
            />
          </View>
        </BottomModal>
      </OnboardingLayout>
    );
  }
}

const styles = StyleSheet.create({
  title: {
    marginVertical: 16,
    fontSize: 16,
    color: colors.darkBlue,
  },
  modalActions: {
    flexDirection: "row",
    paddingTop: 24,
    paddingHorizontal: 8,
  },
  modalAction: {
    marginHorizontal: 8,
    flexGrow: 1,
  },
  modalIconContainer: {
    marginVertical: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  modalText: {
    paddingHorizontal: 16,
    fontSize: 14,
    color: colors.smoke,
    textAlign: "center",
  },
});

export default withOnboardingContext(OnboardingStep06SecurityChecklist);
