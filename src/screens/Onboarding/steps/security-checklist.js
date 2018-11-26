// @flow

import React, { Component, createRef } from "react";
import { Trans } from "react-i18next";
import {
  StyleSheet,
  View,
  Linking,
  ScrollView,
  Dimensions,
} from "react-native";

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

const windowWidth = Dimensions.get("window").width;

type SecurityChecklist = {
  pinCode: ?boolean,
  recoveryPhrase: ?boolean,
};

class OnboardingStepSecurityChecklist extends Component<
  OnboardingStepProps,
  SecurityChecklist,
> {
  state = {
    pinCode: null,
    recoveryPhrase: null,
  };

  Footer = () => {
    const { next } = this.props;
    const { pinCode, recoveryPhrase } = this.state;
    const hidden = !pinCode || !recoveryPhrase;
    if (hidden) return null;
    return (
      <Button
        type="primary"
        title={<Trans i18nKey="common.continue" />}
        onPress={next}
      />
    );
  };

  answerYepPinCode = () => {
    this.setState({ pinCode: true }, () => {
      setTimeout(() => {
        if (this.scrollView.current) {
          this.scrollView.current.scrollTo({ x: windowWidth, animated: true });
        }
      }, 200);
    });
  };

  answerNopePinCode = () => {
    this.setState({ pinCode: false });
  };
  answerYepRecovery = () => {
    this.setState({ recoveryPhrase: true });
  };
  answerNopeRecovery = () => {
    this.setState({ recoveryPhrase: false });
  };

  resetAnswer = () => {
    this.setState({
      recoveryPhrase: null,
      pinCode: null,
    });
    if (this.scrollView.current) {
      this.scrollView.current.scrollTo({ x: 0 });
    }
  };

  contactSupport = () => Linking.openURL(urls.faq);

  scrollView = createRef();

  render() {
    const { pinCode, recoveryPhrase } = this.state;
    const subErr =
      pinCode === false
        ? "pinCode"
        : recoveryPhrase === false
          ? "recoveryPhrase"
          : "";
    const isErrorModalOpened = !!subErr;
    return (
      <OnboardingLayout
        header="OnboardingStepSecurityChecklist"
        Footer={this.Footer}
        noHorizontalPadding
        noScroll
        withNeedHelp
      >
        <ScrollView
          ref={this.scrollView}
          horizontal
          pagingEnabled
          style={styles.pager}
          showsHorizontalScrollIndicator={false}
        >
          <View style={styles.page}>
            <Bullet big>1</Bullet>
            <LText style={styles.title} semiBold>
              <Trans i18nKey="onboarding.stepSecurityChecklist.pinCode.title" />
            </LText>
            <OnboardingChoice
              isChecked={pinCode === true}
              onPress={this.answerYepPinCode}
            >
              <Trans i18nKey="common.yes" />
            </OnboardingChoice>
            <OnboardingChoice
              isChecked={pinCode === false}
              onPress={this.answerNopePinCode}
            >
              <Trans i18nKey="common.no" />
            </OnboardingChoice>
          </View>
          <View style={styles.page}>
            <Bullet big>2</Bullet>
            <LText style={styles.title} semiBold>
              <Trans i18nKey="onboarding.stepSecurityChecklist.recoveryPhrase.title" />
            </LText>
            <OnboardingChoice
              isChecked={recoveryPhrase === true}
              onPress={this.answerYepRecovery}
            >
              <Trans i18nKey="common.yes" />
            </OnboardingChoice>
            <OnboardingChoice
              isChecked={recoveryPhrase === false}
              onPress={this.answerNopeRecovery}
            >
              <Trans i18nKey="common.no" />
            </OnboardingChoice>
          </View>
        </ScrollView>
        <BottomModal isOpened={isErrorModalOpened} onClose={this.resetAnswer}>
          <View style={styles.modalIconContainer}>
            <Circle bg={rgba(colors.alert, 0.1)} size={56}>
              <IconWarning size={24} color={colors.alert} />
            </Circle>
          </View>
          <LText style={styles.modalText}>
            <Trans
              i18nKey={`onboarding.stepSecurityChecklist.${subErr}.error`}
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
    lineHeight: 21,
    color: colors.smoke,
    textAlign: "center",
  },
  pager: {
    flexGrow: 1,
  },
  page: {
    width: windowWidth,
    paddingHorizontal: 16,
  },
});

export default withOnboardingContext(OnboardingStepSecurityChecklist);
