// @flow

import React, { Component } from "react";
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Linking,
  Image,
} from "react-native";
import { Trans } from "react-i18next";

import LText from "../../../components/LText";
import Button from "../../../components/Button";
import OnboardingLayout from "../OnboardingLayout";
import { withOnboardingContext } from "../onboardingContext";
import IconArrowRight from "../../../icons/ArrowRight";
import colors from "../../../colors";
import { urls } from "../../../config/urls";
import { deviceNames } from "../../../wording";

import type { OnboardingStepProps } from "../types";

const logo = <Image source={require("../../../images/logo.png")} />;

const hitSlop = {
  top: 16,
  left: 16,
  right: 16,
  bottom: 16,
};

class OnboardingStep01Welcome extends Component<OnboardingStepProps> {
  buy = () => Linking.openURL(urls.buyNanoX);

  Footer = () => (
    <View style={styles.footer}>
      <LText style={styles.footerText}>
        <Trans i18nKey="onboarding.step01Welcome.noDevice" />
      </LText>
      <TouchableOpacity
        onPress={this.buy}
        style={styles.buyTouch}
        hitSlop={hitSlop}
      >
        <LText style={[styles.footerText, styles.buy]}>
          <Trans
            i18nKey="onboarding.step01Welcome.buy"
            values={deviceNames.nanoX}
          />
        </LText>
        <IconArrowRight size={16} color={colors.live} />
      </TouchableOpacity>
    </View>
  );

  render() {
    return (
      <OnboardingLayout isCentered Footer={this.Footer}>
        <View style={styles.logo}>{logo}</View>
        <LText style={styles.title} secondary semiBold>
          <Trans i18nKey="onboarding.step01Welcome.title" />
        </LText>
        <LText style={styles.subTitle}>
          <Trans
            i18nKey="onboarding.step01Welcome.desc"
            values={deviceNames.nanoX}
          />
        </LText>
        <Button
          type="primary"
          title={<Trans i18nKey="onboarding.step01Welcome.start" />}
          onPress={this.props.next}
        />
      </OnboardingLayout>
    );
  }
}

const styles = StyleSheet.create({
  title: {
    color: colors.darkBlue,
    fontSize: 20,
    textAlign: "center",
    marginBottom: 16,
  },
  subTitle: {
    fontSize: 14,
    color: colors.grey,
    textAlign: "center",
    marginBottom: 32,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  footerText: {
    fontSize: 14,
  },
  buy: {
    marginHorizontal: 5,
    color: colors.live,
  },
  buyTouch: {
    flexDirection: "row",
    alignItems: "center",
  },
  logo: {
    alignItems: "center",
    marginBottom: 32,
  },
});

export default withOnboardingContext(OnboardingStep01Welcome);
