// @flow

import React, { Component, PureComponent } from "react";
import { Trans } from "react-i18next";
import { StyleSheet, View, TouchableOpacity, Linking } from "react-native";
import Icon from "react-native-vector-icons/dist/Feather";

import LText from "../../../components/LText";
import Button from "../../../components/Button";
import Rounded from "../../../components/Rounded";
import Circle from "../../../components/Circle";
import IconExternalLink from "../../../icons/ExternalLink";
import OnboardingLayout from "../OnboardingLayout";
import { withOnboardingContext } from "../onboardingContext";
import colors, { rgba } from "../../../colors";
import { urls } from "../../../config/urls";

import type { OnboardingStepProps } from "../types";

const hitSlop = {
  top: 16,
  left: 16,
  right: 16,
  bottom: 16,
};

class OnboardingStep07PairNew extends Component<OnboardingStepProps> {
  Footer = () => (
    <TouchableOpacity
      style={styles.footer}
      hitSlop={hitSlop}
      onPress={this.help}
    >
      <LText style={styles.footerText} semiBold>
        <Trans i18nKey="common.needHelp" />
      </LText>
      <IconExternalLink size={16} color={colors.live} />
    </TouchableOpacity>
  );

  help = () => Linking.openURL(urls.faq);

  pairNew = () => this.props.navigation.navigate("PairDevices");

  render() {
    return (
      <OnboardingLayout
        header="OnboardingStep07PairNew"
        Footer={this.Footer}
        borderedFooter
      >
        <View style={styles.hero}>
          <Rounded bg={colors.pillActiveBackground}>
            <Icon name="bluetooth" color={colors.live} size={28} />
          </Rounded>
        </View>
        <LText semiBold style={styles.desc}>
          <Trans i18nKey="onboarding.step07PairNew.desc" />
        </LText>
        <Cta onPress={this.pairNew} />
        <Button
          type="secondary"
          title="skip this step"
          containerStyle={{ marginTop: 24 }}
          onPress={this.props.next}
        />
      </OnboardingLayout>
    );
  }
}

class Cta extends PureComponent<{ onPress: () => any }> {
  render() {
    const { onPress } = this.props;
    return (
      <TouchableOpacity style={styles.cta} onPress={onPress}>
        <Circle size={32} bg={rgba(colors.live, 0.1)}>
          <Icon name="plus" color={colors.live} size={16} />
        </Circle>
        <LText style={styles.ctaText} semiBold>
          <Trans i18nKey="onboarding.step07PairNew.pairNew" />
        </LText>
      </TouchableOpacity>
    );
  }
}

const styles = StyleSheet.create({
  hero: {
    paddingVertical: 24,
    alignItems: "center",
  },
  desc: {
    textAlign: "center",
    lineHeight: 21,
    marginHorizontal: 16,
    marginBottom: 32,
  },
  cta: {
    borderWidth: 1,
    borderColor: colors.fog,
    padding: 16,
    borderRadius: 4,
    flexDirection: "row",
    alignItems: "center",
  },
  ctaText: {
    marginLeft: 16,
    color: colors.live,
    fontSize: 16,
  },
  footer: {
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  footerText: {
    color: colors.live,
    marginRight: 8,
  },
});

export default withOnboardingContext(OnboardingStep07PairNew);
