// @flow

import React, { Component } from "react";
import { Trans } from "react-i18next";
import { StyleSheet, TouchableOpacity, Linking } from "react-native";

import LText from "../../../components/LText";
import Button from "../../../components/Button";
import SelectDevice from "../../../components/SelectDevice";
import IconExternalLink from "../../../icons/ExternalLink";
import OnboardingLayout from "../OnboardingLayout";
import { withOnboardingContext } from "../onboardingContext";
import colors from "../../../colors";
import { urls } from "../../../config/urls";

import type { OnboardingStepProps } from "../types";

const hitSlop = {
  top: 16,
  left: 16,
  right: 16,
  bottom: 16,
};

class OnboardingStepPairNew extends Component<OnboardingStepProps> {
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
        header="OnboardingStepPairNew"
        Footer={this.Footer}
        borderedFooter
        noHorizontalPadding
        withNeedHelp
      >
        <SelectDevice onSelect={this.props.next} />
        {__DEV__ ? (
          <Button
            type="lightSecondary"
            title="(DEV) skip this step"
            containerStyle={{ marginTop: 24 }}
            onPress={this.props.next}
          />
        ) : null}
      </OnboardingLayout>
    );
  }
}

const styles = StyleSheet.create({
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

export default withOnboardingContext(OnboardingStepPairNew);
